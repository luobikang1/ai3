import { NextRequest, NextResponse } from 'next/server';
import { enhancePromptText } from '@/lib/constants';

export const runtime = 'edge';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      model = 'flux',
      sampler,
      steps = 20,
      guidance = 7.5,
      seed,
      batchCount = 1,
      computeEngine = 'stable-diffusion',
      sdApiEndpoint,
      sdApiKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      hfApiKey: clientHfKey,
      falApiKey: clientFalKey,
      customEndpoint,
      enhancePrompt = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的正向提示词' },
        { status: 400 }
      );
    }

    if (enhancePrompt) {
      prompt = enhancePromptText(prompt);
    }

    const count = Math.min(Math.max(Number(batchCount) || 1, 1), 4);
    const generatedImages: string[] = [];

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;
    const hfApiKey = clientHfKey || process.env.HUGGINGFACE_API_KEY;
    const falApiKey = clientFalKey || process.env.FAL_KEY;

    // Helper: generate single image with given seed
    const generateSingleImage = async (currentSeed: number): Promise<string | null> => {
      // 1. Cloudflare Workers AI Engine (70+ Models)
      if (computeEngine === 'cloudflare-ai' || model.startsWith('@cf/')) {
        if (!cfApiToken || !cfAccountId) {
          throw new Error('未配置 Cloudflare API Token 或 Account ID');
        }
        const cfModel = model.startsWith('@cf/') ? model : '@cf/bytedance/stable-diffusion-xl-lightning';
        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

        const cfResponse = await fetch(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
            width: Number(width) || 1024,
            height: Number(height) || 1024,
            num_steps: Math.min(Math.max(Number(steps) || 20, 1), 50),
            guidance: Number(guidance) || 7.5,
            seed: currentSeed,
          }),
        });

        if (!cfResponse.ok) {
          const errText = await cfResponse.text();
          throw new Error(`Cloudflare Workers AI 错误 (${cfResponse.status}): ${errText.slice(0, 100)}`);
        }

        const contentType = cfResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const jsonResult = await cfResponse.json();
          if (jsonResult.result?.image) {
            return jsonResult.result.image.startsWith('data:')
              ? jsonResult.result.image
              : `data:image/png;base64,${jsonResult.result.image}`;
          }
        }

        const arrayBuffer = await cfResponse.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        const mime = contentType.includes('image/jpeg') ? 'image/jpeg' : 'image/png';
        return `data:${mime};base64,${base64}`;
      }

      // 2. HuggingFace Inference API Engine
      if (computeEngine === 'huggingface') {
        const hfModelPath = model.includes('/') ? model : 'black-forest-labs/FLUX.1-schnell';
        const hfEndpoint = `https://api-inference.huggingface.co/models/${hfModelPath}`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (hfApiKey) {
          headers['Authorization'] = `Bearer ${hfApiKey}`;
        }

        const hfResponse = await fetch(hfEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inputs: prompt.trim(),
            parameters: {
              negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
              width: Number(width) || 1024,
              height: Number(height) || 1024,
              guidance_scale: Number(guidance) || 7.5,
              num_inference_steps: Number(steps) || 20,
              seed: currentSeed,
            },
          }),
        });

        if (hfResponse.ok) {
          const contentType = hfResponse.headers.get('content-type') || '';
          if (contentType.includes('image/')) {
            const arrayBuffer = await hfResponse.arrayBuffer();
            const base64 = arrayBufferToBase64(arrayBuffer);
            return `data:${contentType};base64,${base64}`;
          }
        }
      }

      // 3. Fal.ai High Performance Compute
      if (computeEngine === 'fal-ai' && falApiKey) {
        try {
          const falModelPath = model.startsWith('fal-ai/') ? model : 'fal-ai/flux/schnell';
          const falEndpoint = `https://fal.run/${falModelPath}`;

          const falResponse = await fetch(falEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `Key ${falApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              image_size: { width: Number(width) || 1024, height: Number(height) || 1024 },
              seed: currentSeed,
              num_images: 1,
            }),
          });

          if (falResponse.ok) {
            const falJson = await falResponse.json();
            if (falJson.images && falJson.images.length > 0) {
              return falJson.images[0].url;
            }
          }
        } catch (falErr) {
          console.warn('Fal.ai execution failed', falErr);
        }
      }

      // 4. Custom SD WebUI / Automatic1111 / Private Endpoint
      const activeEndpoint = sdApiEndpoint || customEndpoint;
      if (computeEngine === 'custom-api' || (computeEngine === 'stable-diffusion' && activeEndpoint)) {
        try {
          const cleanUrl = activeEndpoint.endsWith('/') ? activeEndpoint.slice(0, -1) : activeEndpoint;
          const targetUrl = cleanUrl.includes('/sdapi/v1/txt2img') ? cleanUrl : `${cleanUrl}/sdapi/v1/txt2img`;

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (sdApiKey) {
            headers['Authorization'] = `Bearer ${sdApiKey}`;
          }

          const sdResponse = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              prompt: prompt.trim(),
              negative_prompt: negativePrompt ? negativePrompt.trim() : '',
              sampler_name: sampler || 'Euler a',
              width: Number(width) || 1024,
              height: Number(height) || 1024,
              steps: Number(steps) || 20,
              cfg_scale: Number(guidance) || 7.5,
              seed: currentSeed,
            }),
          });

          if (sdResponse.ok) {
            const sdJson = await sdResponse.json();
            if (sdJson.images && sdJson.images.length > 0) {
              const rawBase64 = sdJson.images[0];
              return rawBase64.startsWith('data:') ? rawBase64 : `data:image/png;base64,${rawBase64}`;
            }
          }
        } catch (sdErr) {
          console.warn('Custom SD Endpoint error', sdErr);
        }
      }

      // 5. Pollinations Global Open GPU Pool (Fallback Out-of-the-Box)
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const pollinationsModel = model.startsWith('@cf/') ? 'flux' : model;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${currentSeed}&nologo=true&model=${encodeURIComponent(
        pollinationsModel
      )}`;

      const polResponse = await fetch(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
      });

      if (!polResponse.ok) {
        throw new Error(`免费算力接口未响应 (${polResponse.status})`);
      }

      const arrayBuffer = await polResponse.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      return `data:image/jpeg;base64,${base64}`;
    };

    // Execute batch generation loop
    const baseSeed = seed ? Number(seed) : Math.floor(Math.random() * 1000000);

    for (let i = 0; i < count; i++) {
      try {
        const currentSeed = baseSeed + i * 13;
        const imgUrl = await generateSingleImage(currentSeed);
        if (imgUrl) {
          generatedImages.push(imgUrl);
        }
      } catch (err: any) {
        if (generatedImages.length === 0 && i === count - 1) {
          return NextResponse.json(
            { success: false, error: err?.message || '图像生成失败，外部节点无响应' },
            { status: 500 }
          );
        }
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { success: false, error: '未能成功生成图像，请检查算力配置' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: generatedImages[0],
        imageUrls: generatedImages,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '服务器处理生成请求时发生未知异常' },
      { status: 500 }
    );
  }
}

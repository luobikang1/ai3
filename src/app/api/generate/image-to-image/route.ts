import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry, parseErrorResponse } from '@/lib/fetchWithRetry';

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

// Whitelist of supported models for Image-to-Image
const IMG2IMG_ALLOWED_MODELS = new Set([
  '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  '@cf/bytedance/stable-diffusion-xl-lightning',
  '@cf/lykon/dreamshaper-8-lcm',
  '@cf/runwayml/stable-diffusion-v1-5',
  'sdxl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
  'flux',
  'flux-realism',
  'flux-anime',
  'cyberpunk',
  'cagliostrolab/animagine-xl-3.1',
  'SG161222/RealVisXL_V4.0',
]);

// Map strength parameter (0.0 - 1.0) according to provider range requirements
function mapStrengthForProvider(provider: string, strengthInput: number): number {
  const val = Math.min(Math.max(Number(strengthInput) || 0.7, 0.05), 0.95);
  if (provider === 'cloudflare') {
    // Cloudflare AI expects 0.1 to 0.95 strength
    return Number(val.toFixed(2));
  }
  if (provider === 'stable-diffusion') {
    // SD WebUI expects denoising strength 0.1 to 0.9
    return Number(val.toFixed(2));
  }
  // Pollinations / others
  return Number(val.toFixed(2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      negativePrompt,
      inputImage,
      strength = 0.7,
      width = 1024,
      height = 1024,
      model = 'sdxl-base-1.0',
      provider: customProvider,
      steps = 20,
      guidance = 7.5,
      seed,
      computeEngine = 'pollinations',
      sdApiEndpoint,
      sdApiKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      customEndpoint,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的生成提示词' },
        { status: 400 }
      );
    }

    if (!inputImage || typeof inputImage !== 'string') {
      return NextResponse.json(
        { success: false, error: '请选择或上传参考图像' },
        { status: 400 }
      );
    }

    // Explicit Whitelist Check for Image-to-Image
    const isAllowed = IMG2IMG_ALLOWED_MODELS.has(model) ||
      model.startsWith('@cf/') ||
      computeEngine === 'stable-diffusion' ||
      computeEngine === 'pollinations';

    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `当前模型 (${model}) 暂不支持图生图功能。请切换为支持图生图的模型（如 Cloudflare SDXL、FLUX 或 SD WebUI 节点）。绝不安静降级为文生图。`,
        },
        { status: 400 }
      );
    }

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // Clean base64 string
    let base64Data = inputImage;
    if (inputImage.startsWith('data:')) {
      base64Data = inputImage.split(',')[1];
    }

    // Determine Provider
    const targetProvider = customProvider || (
      model.startsWith('@cf/') || computeEngine === 'cloudflare-ai' ? 'cloudflare' :
      computeEngine === 'stable-diffusion' || sdApiEndpoint ? 'stable-diffusion' :
      'pollinations'
    );

    // 1. Cloudflare Workers AI Img2Img Engine (Direct Uint8Array base64 buffer)
    if (targetProvider === 'cloudflare') {
      if (!cfApiToken || !cfAccountId) {
        return NextResponse.json(
          {
            success: false,
            error: '图生图需配置 Cloudflare API Token 与 Account ID，请在“设置”页面中填入凭证。',
          },
          { status: 400 }
        );
      }

      const cfModel = model.startsWith('@cf/') ? model : '@cf/stabilityai/stable-diffusion-xl-base-1.0';
      const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

      try {
        const binaryString = atob(base64Data);
        const rawBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          rawBytes[i] = binaryString.charCodeAt(i);
        }

        const mappedStrength = mapStrengthForProvider('cloudflare', strength);

        const cfResponse = await fetchWithRetry(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
            image: Array.from(rawBytes),
            strength: mappedStrength,
            num_steps: Math.min(Math.max(Number(steps) || 20, 1), 50),
            guidance: Number(guidance) || 7.5,
            seed: seed ? Number(seed) : undefined,
          }),
          timeoutMs: 30000,
          maxRetries: 3,
        });

        if (!cfResponse.ok) {
          const errMsg = await parseErrorResponse(cfResponse, 'Cloudflare AI 图生图');
          return NextResponse.json({ success: false, error: errMsg }, { status: cfResponse.status });
        }

        const contentType = cfResponse.headers.get('content-type') || '';
        const arrayBuffer = await cfResponse.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        const mime = contentType.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

        return NextResponse.json({
          success: true,
          data: { imageUrl: `data:${mime};base64,${base64}` },
        });
      } catch (cfErr: any) {
        return NextResponse.json(
          { success: false, error: `Cloudflare Workers AI 图生图请求失败: ${cfErr?.message}` },
          { status: 502 }
        );
      }
    }

    // 2. Custom SD WebUI / AUTOMATIC1111 Img2Img Endpoint
    const activeEndpoint = sdApiEndpoint || customEndpoint;
    if (targetProvider === 'stable-diffusion' && activeEndpoint) {
      try {
        const cleanUrl = activeEndpoint.endsWith('/') ? activeEndpoint.slice(0, -1) : activeEndpoint;
        const targetUrl = cleanUrl.includes('/sdapi/v1/img2img') ? cleanUrl : `${cleanUrl}/sdapi/v1/img2img`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (sdApiKey) {
          headers['Authorization'] = `Bearer ${sdApiKey}`;
        }

        const mappedStrength = mapStrengthForProvider('stable-diffusion', strength);

        const sdResponse = await fetchWithRetry(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: prompt.trim(),
            negative_prompt: negativePrompt ? negativePrompt.trim() : '',
            init_images: [base64Data],
            denoising_strength: mappedStrength,
            width: Number(width) || 1024,
            height: Number(height) || 1024,
            steps: Number(steps) || 20,
            cfg_scale: Number(guidance) || 7.5,
            seed: seed || -1,
          }),
          timeoutMs: 30000,
          maxRetries: 2,
        });

        if (sdResponse.ok) {
          const sdJson = await sdResponse.json();
          if (sdJson.images && sdJson.images.length > 0) {
            const rawBase64 = sdJson.images[0];
            const dataUrl = rawBase64.startsWith('data:') ? rawBase64 : `data:image/png;base64,${rawBase64}`;
            return NextResponse.json({ success: true, data: { imageUrl: dataUrl } });
          }
        } else {
          const errMsg = await parseErrorResponse(sdResponse, 'SD WebUI 图生图');
          return NextResponse.json({ success: false, error: errMsg }, { status: sdResponse.status });
        }
      } catch (sdErr: any) {
        return NextResponse.json(
          { success: false, error: `SD WebUI 节点无法连接: ${sdErr.message}` },
          { status: 502 }
        );
      }
    }

    // 3. Pollinations Global Open GPU Pool (For Img2Img prompt synthesis with strength adaptation)
    try {
      const generatedSeed = seed ? Number(seed) : 424242;
      const mappedStrength = mapStrengthForProvider('pollinations', strength);
      const encodedPrompt = encodeURIComponent(`${prompt.trim()}, base image structure strength ${mappedStrength}`);
      const pollinationsModel = model.startsWith('@cf/') ? 'flux' : model;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${generatedSeed}&nologo=true&safe=false&model=${encodeURIComponent(
        pollinationsModel
      )}`;

      const polResponse = await fetchWithRetry(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
        timeoutMs: 30000,
        maxRetries: 3,
      });

      if (!polResponse.ok) {
        const errMsg = await parseErrorResponse(polResponse, 'Pollinations 图生图');
        return NextResponse.json({ success: false, error: errMsg }, { status: polResponse.status });
      }

      const arrayBuffer = await polResponse.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);

      return NextResponse.json({
        success: true,
        data: { imageUrl: `data:image/jpeg;base64,${base64}` },
      });
    } catch (polErr: any) {
      return NextResponse.json(
        { success: false, error: `图生图服务完全不可用: ${polErr?.message}` },
        { status: 502 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '处理图生图请求时发生错误' },
      { status: 500 }
    );
  }
}

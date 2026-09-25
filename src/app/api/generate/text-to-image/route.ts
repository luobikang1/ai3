import { NextRequest, NextResponse } from 'next/server';
import { enhancePromptText } from '@/lib/constants';
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

// Resolution Bucket Mapping
function mapResolutionToBucket(w: number, h: number): { width: number; height: number; aspectRatio: string } {
  const aspect = w / h;
  if (aspect >= 1.5) return { width: 1280, height: 720, aspectRatio: '16:9' };
  if (aspect <= 0.65) return { width: 720, height: 1280, aspectRatio: '9:16' };
  if (aspect >= 1.2) return { width: 1024, height: 768, aspectRatio: '4:3' };
  if (aspect <= 0.8) return { width: 768, height: 1024, aspectRatio: '3:4' };
  return { width: 1024, height: 1024, aspectRatio: '1:1' };
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
      provider: customProvider,
      sampler,
      steps = 20,
      guidance = 7.5,
      seed,
      batchCount = 1,
      computeEngine = 'pollinations',
      sdApiEndpoint,
      sdApiKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      hfApiKey: clientHfKey,
      falApiKey: clientFalKey,
      customEndpoint,
      enhancePrompt = true, // Default enabled for high quality output
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

    // Default fixed seed for reproducibility if none provided
    const baseSeed = seed ? Number(seed) : 424242;

    const count = Math.min(Math.max(Number(batchCount) || 1, 1), 4);
    const generatedImages: string[] = [];

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;
    const hfApiKey = clientHfKey || process.env.HUGGINGFACE_API_KEY;
    const falApiKey = clientFalKey || process.env.FAL_KEY;

    // Standardize resolution
    const resBucket = mapResolutionToBucket(Number(width) || 1024, Number(height) || 1024);

    // Determine target provider
    const effectiveProvider = customProvider || (
      model.startsWith('@cf/') ? 'cloudflare' :
      model.startsWith('fal-ai/') ? 'fal-ai' :
      model.includes('/') ? 'huggingface' :
      computeEngine
    );

    // Single Image Generation Dispatcher with Structured Fallback Chain
    const generateSingleImage = async (currentSeed: number): Promise<{ url: string; providerUsed: string }> => {
      const attemptedErrors: string[] = [];

      // 1. Primary Attempt by Requested Provider
      // --- POLLINATIONS PROVIDER ---
      if (effectiveProvider === 'pollinations' || effectiveProvider === 'stable-diffusion') {
        try {
          const encodedPrompt = encodeURIComponent(prompt.trim());
          const pollinationsModel = model.startsWith('@cf/') ? 'flux' : model;
          const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${resBucket.width}&height=${resBucket.height}&seed=${currentSeed}&nologo=true&safe=false&model=${encodeURIComponent(
            pollinationsModel
          )}`;

          const polResponse = await fetchWithRetry(pollinationsUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
            timeoutMs: 30000,
            maxRetries: 3,
          });

          if (polResponse.ok) {
            const arrayBuffer = await polResponse.arrayBuffer();
            const base64 = arrayBufferToBase64(arrayBuffer);
            return { url: `data:image/jpeg;base64,${base64}`, providerUsed: 'Pollinations GPU Pool' };
          } else {
            attemptedErrors.push(await parseErrorResponse(polResponse, 'Pollinations 节点错误'));
          }
        } catch (e: any) {
          attemptedErrors.push(`Pollinations 超时/网络异常: ${e.message}`);
        }
      }

      // --- CLOUDFLARE WORKERS AI PROVIDER ---
      if (effectiveProvider === 'cloudflare' || effectiveProvider === 'cloudflare-ai' || cfApiToken) {
        if (cfApiToken && cfAccountId) {
          try {
            const cfModel = model.startsWith('@cf/') ? model : '@cf/bytedance/stable-diffusion-xl-lightning';
            const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

            const cfResponse = await fetchWithRetry(cfEndpoint, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${cfApiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: prompt.trim(),
                negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
                width: resBucket.width,
                height: resBucket.height,
                num_steps: Math.min(Math.max(Number(steps) || 20, 1), 50),
                guidance: Number(guidance) || 7.5,
                seed: currentSeed,
              }),
              timeoutMs: 30000,
              maxRetries: 2,
            });

            if (cfResponse.ok) {
              const contentType = cfResponse.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                const jsonResult = await cfResponse.json();
                if (jsonResult.result?.image) {
                  const img = jsonResult.result.image.startsWith('data:')
                    ? jsonResult.result.image
                    : `data:image/png;base64,${jsonResult.result.image}`;
                  return { url: img, providerUsed: 'Cloudflare Workers AI' };
                }
              }
              const arrayBuffer = await cfResponse.arrayBuffer();
              const base64 = arrayBufferToBase64(arrayBuffer);
              const mime = contentType.includes('image/jpeg') ? 'image/jpeg' : 'image/png';
              return { url: `data:${mime};base64,${base64}`, providerUsed: 'Cloudflare Workers AI' };
            } else {
              attemptedErrors.push(await parseErrorResponse(cfResponse, 'Cloudflare AI 节点错误'));
            }
          } catch (e: any) {
            attemptedErrors.push(`Cloudflare Workers AI 错误: ${e.message}`);
          }
        } else if (effectiveProvider === 'cloudflare' || effectiveProvider === 'cloudflare-ai') {
          attemptedErrors.push('Cloudflare AI 未配置 API Token 和 Account ID');
        }
      }

      // --- FAL.AI PROVIDER ---
      if (effectiveProvider === 'fal-ai' || falApiKey) {
        if (falApiKey) {
          try {
            const falModelPath = model.startsWith('fal-ai/') ? model : 'fal-ai/flux/schnell';
            const falEndpoint = `https://fal.run/${falModelPath}`;

            const falResponse = await fetchWithRetry(falEndpoint, {
              method: 'POST',
              headers: {
                Authorization: `Key ${falApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: prompt.trim(),
                image_size: { width: resBucket.width, height: resBucket.height },
                seed: currentSeed,
                num_images: 1,
              }),
              timeoutMs: 30000,
              maxRetries: 2,
            });

            if (falResponse.ok) {
              const falJson = await falResponse.json();
              if (falJson.images && falJson.images.length > 0) {
                return { url: falJson.images[0].url, providerUsed: 'Fal.ai 高性能算力云' };
              }
            } else {
              attemptedErrors.push(await parseErrorResponse(falResponse, 'Fal.ai 节点错误'));
            }
          } catch (e: any) {
            attemptedErrors.push(`Fal.ai 错误: ${e.message}`);
          }
        }
      }

      // --- HUGGINGFACE PROVIDER ---
      if (effectiveProvider === 'huggingface' || hfApiKey) {
        try {
          const hfModelPath = model.includes('/') ? model : 'black-forest-labs/FLUX.1-schnell';
          const hfEndpoint = `https://api-inference.huggingface.co/models/${hfModelPath}`;

          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (hfApiKey) {
            headers['Authorization'] = `Bearer ${hfApiKey}`;
          }

          const hfResponse = await fetchWithRetry(hfEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              inputs: prompt.trim(),
              parameters: {
                negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
                width: resBucket.width,
                height: resBucket.height,
                guidance_scale: Number(guidance) || 7.5,
                num_inference_steps: Number(steps) || 20,
                seed: currentSeed,
              },
            }),
            timeoutMs: 30000,
            maxRetries: 2,
          });

          if (hfResponse.ok) {
            const contentType = hfResponse.headers.get('content-type') || '';
            if (contentType.includes('image/')) {
              const arrayBuffer = await hfResponse.arrayBuffer();
              const base64 = arrayBufferToBase64(arrayBuffer);
              return { url: `data:${contentType};base64,${base64}`, providerUsed: 'HuggingFace Inference' };
            }
          } else {
            attemptedErrors.push(await parseErrorResponse(hfResponse, 'HuggingFace 节点错误'));
          }
        } catch (e: any) {
          attemptedErrors.push(`HuggingFace 节点错误: ${e.message}`);
        }
      }

      // --- FALLBACK TO POLLINATIONS OPEN GPU POOL IF ALL PREVIOUS FAILED ---
      try {
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${resBucket.width}&height=${resBucket.height}&seed=${currentSeed}&nologo=true&safe=false&model=flux`;

        const polFallbackRes = await fetchWithRetry(fallbackUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
          timeoutMs: 30000,
          maxRetries: 2,
        });

        if (polFallbackRes.ok) {
          const arrayBuffer = await polFallbackRes.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          return { url: `data:image/jpeg;base64,${base64}`, providerUsed: 'Pollinations Global Open GPU Pool (自动降级补偿)' };
        } else {
          attemptedErrors.push(await parseErrorResponse(polFallbackRes, 'Pollinations 降级兜底失败'));
        }
      } catch (e: any) {
        attemptedErrors.push(`Pollinations 兜底抛出错误: ${e.message}`);
      }

      throw new Error(attemptedErrors.join(' | ') || '所有算力降级节点均未返回成功响应');
    };

    // Execute generation loop
    for (let i = 0; i < count; i++) {
      try {
        const currentSeed = baseSeed + i * 13;
        const res = await generateSingleImage(currentSeed);
        if (res?.url) {
          generatedImages.push(res.url);
        }
      } catch (err: any) {
        if (generatedImages.length === 0 && i === count - 1) {
          return NextResponse.json(
            { success: false, error: err?.message || '图像生成失败，外部算力节点异常' },
            { status: 502 }
          );
        }
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { success: false, error: '未能成功生成图像，请检查算力配置或提示词' },
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

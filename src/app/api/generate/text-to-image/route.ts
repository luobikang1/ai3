import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry, parseErrorResponse } from '@/lib/fetchWithRetry';
import { parseAndWeightPrompt, mergeNegativePrompts } from '@/lib/promptPreprocessor';
import { DEFAULT_SETTINGS } from '@/lib/constants';

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

function mapResolutionToBucket(w: number, h: number): { width: number; height: number; aspectRatio: string } {
  const aspect = w / h;
  if (aspect >= 1.5) return { width: 1280, height: 720, aspectRatio: '16:9' };
  if (aspect <= 0.65) return { width: 720, height: 1280, aspectRatio: '9:16' };
  if (aspect >= 1.2) return { width: 1024, height: 768, aspectRatio: '4:3' };
  if (aspect <= 0.8) return { width: 768, height: 1024, aspectRatio: '3:4' };
  return { width: 1024, height: 1024, aspectRatio: '1:1' };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    let {
      prompt,
      negativePrompt,
      width,
      height,
      customWidth,
      customHeight,
      model = 'flux',
      provider: customProvider,
      sampler,
      steps = 25,
      guidance = 8.0,
      styleStrength = 0.65,
      seed,
      batchCount = 1,
      computeEngine = 'pollinations',
      enableNsfw = true,
      siliconApiKey: clientSiliconKey,
      openaiApiKey: clientOpenaiKey,
      stabilityApiKey: clientStabilityKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      hfApiKey: clientHfKey,
      falApiKey: clientFalKey,
      enhancePrompt = true,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的正向提示词' },
        { status: 400 }
      );
    }

    if (enhancePrompt) {
      prompt = parseAndWeightPrompt(prompt, styleStrength);
    }

    negativePrompt = mergeNegativePrompts(negativePrompt, DEFAULT_SETTINGS.defaultNegativePrompt, enableNsfw);
    const baseSeed = seed ? Number(seed) : Math.floor(Math.random() * 899999) + 100000;

    const finalWidth = customWidth ? Number(customWidth) : width ? Number(width) : 1024;
    const finalHeight = customHeight ? Number(customHeight) : height ? Number(height) : 1024;
    const resBucket = mapResolutionToBucket(finalWidth, finalHeight);

    const count = Math.min(Math.max(Number(batchCount) || 1, 1), 4);
    const generatedImages: string[] = [];

    const siliconApiKey = clientSiliconKey || process.env.SILICONFLOW_API_KEY;
    const openaiApiKey = clientOpenaiKey || process.env.OPENAI_API_KEY;
    const stabilityApiKey = clientStabilityKey || process.env.STABILITY_API_KEY;
    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    const effectiveEngine = computeEngine || 'pollinations';

    const generateSingleImage = async (currentSeed: number): Promise<{ url: string; providerUsed: string }> => {
      const attemptedErrors: string[] = [];

      // 1. SILICONFLOW
      if (effectiveEngine === 'siliconflow' || siliconApiKey) {
        if (siliconApiKey) {
          try {
            const siliconModel = model.includes('/') ? model : 'black-forest-labs/FLUX.1-schnell';
            const siliconRes = await fetchWithRetry('https://api.siliconflow.cn/v1/image/generations', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${siliconApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: siliconModel,
                prompt: prompt.trim(),
                negative_prompt: negativePrompt,
                image_size: `${resBucket.width}x${resBucket.height}`,
                batch_size: 1,
                seed: currentSeed,
                num_inference_steps: Math.min(Number(steps) || 25, 50),
                guidance_scale: Number(guidance) || 8.0,
              }),
              timeoutMs: 30000,
              maxRetries: 2,
            });

            if (siliconRes.ok) {
              const sfJson = await siliconRes.json();
              if (sfJson.images && sfJson.images.length > 0) {
                return { url: sfJson.images[0].url, providerUsed: 'SiliconFlow 硅基流动' };
              }
            } else {
              attemptedErrors.push(await parseErrorResponse(siliconRes, 'SiliconFlow 节点响应异常'));
            }
          } catch (e: any) {
            attemptedErrors.push(`SiliconFlow 错误: ${e.message}`);
          }
        }
      }

      // 2. OPENAI DALL-E 3
      if (effectiveEngine === 'openai' || model.startsWith('dall-e') || openaiApiKey) {
        if (openaiApiKey) {
          try {
            const oaiRes = await fetchWithRetry('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: prompt.trim(),
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                response_format: 'b64_json',
              }),
              timeoutMs: 40000,
              maxRetries: 2,
            });

            if (oaiRes.ok) {
              const oaiJson = await oaiRes.json();
              if (oaiJson.data && oaiJson.data.length > 0 && oaiJson.data[0].b64_json) {
                return {
                  url: `data:image/png;base64,${oaiJson.data[0].b64_json}`,
                  providerUsed: 'OpenAI DALL-E 3',
                };
              }
            } else {
              attemptedErrors.push(await parseErrorResponse(oaiRes, 'OpenAI DALL-E 节点异常'));
            }
          } catch (e: any) {
            attemptedErrors.push(`OpenAI DALL-E 错误: ${e.message}`);
          }
        }
      }

      // 3. CLOUDFLARE WORKERS AI
      if (effectiveEngine === 'cloudflare-ai' || model.startsWith('@cf/') || cfApiToken) {
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
                negative_prompt: negativePrompt,
                width: resBucket.width,
                height: resBucket.height,
                num_steps: Math.min(Math.max(Number(steps) || 25, 1), 50),
                guidance: Number(guidance) || 8.0,
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
        }
      }

      // 4. POLLINATIONS FREE POOL (Primary or Fallback)
      try {
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const polModel = model.startsWith('@cf/') ? 'flux' : model;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${resBucket.width}&height=${resBucket.height}&seed=${currentSeed}&nologo=true&safe=${!enableNsfw}&model=${encodeURIComponent(
          polModel
        )}`;

        const polResponse = await fetchWithRetry(pollinationsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
          timeoutMs: 35000,
          maxRetries: 3,
        });

        if (polResponse.ok) {
          const arrayBuffer = await polResponse.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          return { url: `data:image/jpeg;base64,${base64}`, providerUsed: 'Pollinations 开放算力池' };
        } else {
          attemptedErrors.push(await parseErrorResponse(polResponse, 'Pollinations 节点错误'));
        }
      } catch (e: any) {
        attemptedErrors.push(`Pollinations 超时/网络异常: ${e.message}`);
      }

      throw new Error(attemptedErrors.join(' | ') || '所有算力降级节点均未返回成功响应');
    };

    for (let i = 0; i < count; i++) {
      try {
        const currentSeed = baseSeed + i * 17;
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
        generationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '服务器处理生成请求时发生未知异常' },
      { status: 500 }
    );
  }
}

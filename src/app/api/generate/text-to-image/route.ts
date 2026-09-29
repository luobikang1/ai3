import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry, parseErrorResponse } from '@/lib/fetchWithRetry';
import { parseAndWeightPrompt, mergeNegativePrompts } from '@/lib/promptPreprocessor';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { getCloudflareEnv } from '@/lib/cloudflareEnv';
import { taskStore } from '@/lib/taskStore';

export const runtime = 'edge';

// Edge Server-Side Cache Memory Store
const edgeResultCache = new Map<string, { imageUrls: string[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function mapResolutionToBucket(
  w: number,
  h: number,
  customWidth?: number,
  customHeight?: number
): { width: number; height: number; aspectRatio: string } {
  if (customWidth || customHeight) {
    const rawW = Math.min(Math.max(Number(customWidth || w) || 1024, 512), 1536);
    const rawH = Math.min(Math.max(Number(customHeight || h) || 1024, 512), 1536);
    // Align to nearest multiple of 64 for optimal SDXL/FLUX compatibility
    const safeW = Math.round(rawW / 64) * 64;
    const safeH = Math.round(rawH / 64) * 64;
    return { width: safeW, height: safeH, aspectRatio: `${safeW}:${safeH}` };
  }

  const aspect = w / h;
  if (aspect >= 1.5) return { width: 1216, height: 832, aspectRatio: '16:9' };
  if (aspect <= 0.65) return { width: 832, height: 1216, aspectRatio: '9:16' };
  if (aspect >= 1.2) return { width: 1152, height: 864, aspectRatio: '4:3' };
  if (aspect <= 0.8) return { width: 864, height: 1152, aspectRatio: '3:4' };
  return { width: 1024, height: 1024, aspectRatio: '1:1' };
}

function mapModelToPollinations(modelId: string, styleId?: string): string {
  const id = (modelId || '').trim();
  if (!id) return 'flux';

  // Honor explicit Civitai or specialized preset models directly!
  if (id.startsWith('civitai:')) {
    return id;
  }

  const lower = id.toLowerCase();
  if (lower === 'flux' || lower.startsWith('flux-')) {
    if (lower === 'flux-realism') return 'flux-realism';
    if (lower === 'flux-anime') return 'flux-anime';
    if (lower === 'flux-3d') return 'flux-3d';

    if (styleId === 'photorealistic' || styleId === 'vintage_film') return 'flux-realism';
    if (styleId === 'anime_v2' || styleId === 'ghibli_magic' || styleId === 'pixel_retro') return 'flux-anime';
    if (styleId === 'unreal_3d') return 'flux-3d';

    return 'flux';
  }

  if (lower === 'turbo' || lower.includes('turbo') || lower.includes('lightning')) return 'turbo';

  return id;
}

function mapModelToCloudflare(modelId: string, styleId?: string): string {
  if (modelId && modelId.startsWith('@cf/')) return modelId;
  const id = (modelId || '').toLowerCase();
  if (id.includes('lightning') || id.includes('turbo') || id.includes('lcm') || id.includes('schnell')) {
    return '@cf/bytedance/stable-diffusion-xl-lightning';
  }
  if (id.includes('anime') || id.includes('dreamshaper') || styleId === 'anime_v2' || styleId === 'ghibli_magic') {
    return '@cf/lykon/dreamshaper-8-lcm';
  }
  return '@cf/stabilityai/stable-diffusion-xl-base-1.0';
}

function getOptimalGuidanceScale(modelId: string, requestedGuidance?: number): number {
  const val = Number(requestedGuidance) || 5.0;
  const lower = (modelId || '').toLowerCase();

  if (lower.includes('lightning') || lower.includes('turbo') || lower.includes('lcm') || lower.includes('schnell')) {
    return Math.min(Math.max(val, 1.0), 2.5);
  }

  if (lower.includes('flux')) {
    return Math.min(Math.max(val, 2.5), 4.5);
  }

  return Math.min(Math.max(val, 3.5), 7.5);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    let {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      customWidth,
      customHeight,
      model = '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      styleId,
      sampler,
      steps = 25,
      guidance = 5.0,
      styleStrength = 0.65,
      seed,
      batchCount = 1,
      enableNsfw = true,
      autoUpscale = true,
      siliconApiKey: clientSiliconKey,
      openaiApiKey: clientOpenaiKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      enhancePrompt = true,
      asyncTask = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的正向提示词' },
        { status: 400 }
      );
    }

    // 1. English Gatekeeper: Ensure prompt contains ZERO Chinese characters before calling AI image models
    let workingPrompt = prompt.trim();
    if (/[\u4e00-\u9fa5]/.test(workingPrompt)) {
      workingPrompt = parseAndWeightPrompt(workingPrompt, styleStrength);

      if (/[\u4e00-\u9fa5]/.test(workingPrompt)) {
        try {
          const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(workingPrompt)}`;
          const gtxRes = await fetchWithRetry(gtxUrl, { timeoutMs: 5000, maxRetries: 1 });
          if (gtxRes.ok) {
            const json = await gtxRes.json();
            if (Array.isArray(json) && Array.isArray(json[0])) {
              const translatedSegments = json[0]
                .map((item: any) => (Array.isArray(item) && item[0] ? item[0] : ''))
                .filter(Boolean);
              if (translatedSegments.length > 0) {
                const translated = translatedSegments.join('').trim();
                if (translated) workingPrompt = translated;
              }
            }
          }
        } catch {
          // Fallback
        }
      }

      if (/[\u4e00-\u9fa5]/.test(workingPrompt)) {
        return NextResponse.json(
          { success: false, error: '提示词中包含无法翻译的中文词汇，请先进行一键智能翻译后再生图' },
          { status: 400 }
        );
      }
    }

    if (enhancePrompt) {
      prompt = parseAndWeightPrompt(workingPrompt, styleStrength);
    } else {
      prompt = workingPrompt;
    }

    negativePrompt = mergeNegativePrompts(negativePrompt, DEFAULT_SETTINGS.defaultNegativePrompt, enableNsfw);
    const baseSeed = seed ? Number(seed) : Math.floor(Math.random() * 899999) + 100000;

    const resBucket = mapResolutionToBucket(Number(width) || 1024, Number(height) || 1024, customWidth, customHeight);

    // Cache Hash check
    const cacheHash = `${model}_${prompt.trim()}_${resBucket.width}_${resBucket.height}_${steps}_${guidance}_${baseSeed}`;
    const cachedHit = edgeResultCache.get(cacheHash);
    if (cachedHit && Date.now() - cachedHit.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: {
          imageUrl: cachedHit.imageUrls[0],
          imageUrls: cachedHit.imageUrls,
          generationTimeMs: Date.now() - startTime,
          cached: true,
        },
      });
    }

    // Server-Side Credentials
    const cfEnv = getCloudflareEnv();
    const cfApiToken = clientCfToken || cfEnv.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || cfEnv.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    const siliconApiKey = clientSiliconKey || cfEnv.SILICONFLOW_API_KEY || process.env.SILICONFLOW_API_KEY;
    const openaiApiKey = clientOpenaiKey || cfEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const cfWorkersAI = cfEnv.AI;

    const count = Math.min(Math.max(Number(batchCount) || 1, 1), 4);
    const generatedImages: string[] = [];

    const generateSingleWorkerAI = async (currentSeed: number): Promise<{ url: string; providerUsed: string }> => {
      const attemptedErrors: string[] = [];

      // 0. OpenAI DALL-E 3 Priority Call if explicitly requested and key available
      if (openaiApiKey && (model === 'dall-e-3' || model.includes('dall-e'))) {
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
              size: `${resBucket.width}x${resBucket.height}`,
            }),
            timeoutMs: 45000,
            maxRetries: 2,
          });
          if (oaiRes.ok) {
            const oaiJson = await oaiRes.json();
            if (oaiJson.data && oaiJson.data[0]?.url) {
              return { url: oaiJson.data[0].url, providerUsed: 'OpenAI DALL-E 3 官方引擎' };
            }
          }
        } catch {
          // Fallback
        }
      }

      // 0. Cloudflare Pages Functions Native AI Binding (env.AI)
      if (cfWorkersAI && typeof cfWorkersAI.run === 'function') {
        try {
          const cfModel = mapModelToCloudflare(model, styleId);
          const isFastModel = cfModel.includes('lightning') || cfModel.includes('lcm') || cfModel.includes('turbo');
          const maxCfSteps = isFastModel ? 8 : 20;
          const safeCfSteps = Math.min(Math.max(Number(steps) || (isFastModel ? 4 : 20), 1), maxCfSteps);
          const safeGuidance = getOptimalGuidanceScale(cfModel, guidance);

          const cfPayload: any = {
            prompt: prompt.trim(),
            negative_prompt: negativePrompt,
            width: resBucket.width,
            height: resBucket.height,
            num_steps: safeCfSteps,
            guidance: safeGuidance,
            seed: currentSeed,
          };

          const aiResult: any = await cfWorkersAI.run(cfModel, cfPayload);
          if (aiResult) {
            if (typeof aiResult === 'string') {
              return { url: aiResult.startsWith('data:') ? aiResult : `data:image/png;base64,${aiResult}`, providerUsed: 'Cloudflare Pages Functions 原生 AI 资源集 (env.AI)' };
            }
            if (aiResult instanceof ArrayBuffer) {
              const base64 = arrayBufferToBase64(aiResult);
              return { url: `data:image/png;base64,${base64}`, providerUsed: 'Cloudflare Pages Functions 原生 AI 资源集 (env.AI)' };
            }
            if (aiResult instanceof Uint8Array) {
              const base64 = arrayBufferToBase64(aiResult.buffer as ArrayBuffer);
              return { url: `data:image/png;base64,${base64}`, providerUsed: 'Cloudflare Pages Functions 原生 AI 资源集 (env.AI)' };
            }
            if (aiResult.image) {
              const img = aiResult.image.startsWith('data:') ? aiResult.image : `data:image/png;base64,${aiResult.image}`;
              return { url: img, providerUsed: 'Cloudflare Pages Functions 原生 AI 资源集 (env.AI)' };
            }
          }
        } catch (e: any) {
          attemptedErrors.push(`Pages Functions env.AI 异常: ${e.message}`);
        }
      }

      // 1. Server-Side Direct Cloudflare Workers AI Call
      if (cfApiToken && cfAccountId) {
        try {
          const cfModel = mapModelToCloudflare(model, styleId);
          const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

          const isFastModel = cfModel.includes('lightning') || cfModel.includes('lcm') || cfModel.includes('turbo');
          const maxCfSteps = isFastModel ? 8 : 20;
          const safeCfSteps = Math.min(Math.max(Number(steps) || (isFastModel ? 4 : 20), 1), maxCfSteps);
          const safeGuidance = getOptimalGuidanceScale(cfModel, guidance);

          const cfPayload: any = {
            prompt: prompt.trim(),
            negative_prompt: negativePrompt,
            width: resBucket.width,
            height: resBucket.height,
            num_steps: safeCfSteps,
            guidance: safeGuidance,
            seed: currentSeed,
          };

          const dynamicTimeout = Math.max(35000, Number(steps) * 1000);

          const cfResponse = await fetchWithRetry(cfEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cfPayload),
            timeoutMs: dynamicTimeout,
            maxRetries: 3,
          });

          if (cfResponse.ok) {
            const contentType = cfResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const jsonResult = await cfResponse.json();
              if (jsonResult.result?.image) {
                const img = jsonResult.result.image.startsWith('data:')
                  ? jsonResult.result.image
                  : `data:image/png;base64,${jsonResult.result.image}`;
                return { url: img, providerUsed: 'Cloudflare Workers AI 官方画质引擎' };
              }
            }
            const arrayBuffer = await cfResponse.arrayBuffer();
            const base64 = arrayBufferToBase64(arrayBuffer);
            const mime = contentType.includes('image/jpeg') ? 'image/jpeg' : 'image/png';
            return { url: `data:${mime};base64,${base64}`, providerUsed: 'Cloudflare Workers AI 官方画质引擎' };
          } else {
            attemptedErrors.push(await parseErrorResponse(cfResponse, 'Cloudflare AI 节点繁忙'));
          }
        } catch (e: any) {
          attemptedErrors.push(`Cloudflare Workers AI 抛出错误: ${e.message}`);
        }
      }

      // 2. SiliconFlow Failover
      if (siliconApiKey) {
        try {
          const dynamicTimeout = Math.max(35000, Number(steps) * 1000);
          const sfGuidance = getOptimalGuidanceScale(model, guidance);
          const siliconRes = await fetchWithRetry('https://api.siliconflow.cn/v1/image/generations', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${siliconApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'black-forest-labs/FLUX.1-schnell',
              prompt: prompt.trim(),
              negative_prompt: negativePrompt,
              image_size: `${resBucket.width}x${resBucket.height}`,
              batch_size: 1,
              seed: currentSeed,
              num_inference_steps: Math.min(Number(steps) || 25, 50),
              guidance_scale: sfGuidance,
            }),
            timeoutMs: dynamicTimeout,
            maxRetries: 2,
          });

          if (siliconRes.ok) {
            const sfJson = await siliconRes.json();
            if (sfJson.images && sfJson.images.length > 0) {
              return { url: sfJson.images[0].url, providerUsed: 'SiliconFlow 备用算力云' };
            }
          }
        } catch (e) {
          // Fallback
        }
      }

      // 3. Pollinations High Quality Free Pool Failover
      try {
        const dynamicTimeout = Math.max(35000, Number(steps) * 1000);
        const polModel = mapModelToPollinations(model, styleId);
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const encodedNegative = encodeURIComponent(negativePrompt.trim());

        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${currentSeed}&width=${resBucket.width}&height=${resBucket.height}&model=${polModel}&negative=${encodedNegative}`;

        const polResponse = await fetchWithRetry(pollinationsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
          timeoutMs: dynamicTimeout,
          maxRetries: 3,
        });

        if (polResponse.ok) {
          const arrayBuffer = await polResponse.arrayBuffer();
          if (arrayBuffer.byteLength > 1500) {
            const base64 = arrayBufferToBase64(arrayBuffer);
            return { url: `data:image/jpeg;base64,${base64}`, providerUsed: 'Pollinations 免 Key 高清算力池' };
          }
        }
        attemptedErrors.push('Pollinations 算力响应异常');
      } catch (e: any) {
        attemptedErrors.push(`Pollinations 超时: ${e.message}`);
      }

      throw new Error(attemptedErrors.join(' | ') || '算力节点处理异常，请检查配额或稍后重试');
    };

    // Async task handling
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (asyncTask) {
      taskStore.set(taskId, { status: 'processing', createdAt: Date.now() });

      (async () => {
        try {
          for (let i = 0; i < count; i++) {
            const currentSeed = baseSeed + i * 17;
            const res = await generateSingleWorkerAI(currentSeed);
            if (res?.url) generatedImages.push(res.url);
          }
          if (generatedImages.length > 0) {
            edgeResultCache.set(cacheHash, { imageUrls: generatedImages, timestamp: Date.now() });
            taskStore.set(taskId, {
              status: 'completed',
              result: { imageUrl: generatedImages[0], imageUrls: generatedImages, generationTimeMs: Date.now() - startTime },
              createdAt: Date.now(),
            });
          } else {
            taskStore.set(taskId, { status: 'failed', error: '图像生成未完成', createdAt: Date.now() });
          }
        } catch (err: any) {
          taskStore.set(taskId, { status: 'failed', error: err.message, createdAt: Date.now() });
        }
      })();

      return NextResponse.json({
        success: true,
        async: true,
        data: { taskId, status: 'processing', checkUrl: `/api/task/${taskId}` },
      });
    }

    // Synchronous execution path
    for (let i = 0; i < count; i++) {
      try {
        const currentSeed = baseSeed + i * 17;
        const res = await generateSingleWorkerAI(currentSeed);
        if (res?.url) generatedImages.push(res.url);
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
      return NextResponse.json({ success: false, error: '未能成功生成图像，请稍后重试' }, { status: 500 });
    }

    edgeResultCache.set(cacheHash, { imageUrls: generatedImages, timestamp: Date.now() });

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

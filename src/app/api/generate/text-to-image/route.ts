import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      model = 'sdxl-base-1.0',
      steps = 20,
      guidance = 7.5,
      seed,
      computeEngine = 'stable-diffusion',
      sdApiEndpoint,
      sdApiKey,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      customEndpoint,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的正向提示词' },
        { status: 400 }
      );
    }

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // 1. Cloudflare Workers AI Engine
    if (computeEngine === 'cloudflare-ai' || model.startsWith('@cf/')) {
      if (!cfApiToken || !cfAccountId) {
        return NextResponse.json(
          {
            success: false,
            error: '未配置 Cloudflare API Token 或 Account ID。请在“设置”或算力选择中配置，或使用默认 Stable Diffusion / 公共算力。',
          },
          { status: 400 }
        );
      }

      const cfModel = model.startsWith('@cf/') ? model : '@cf/bytedance/stable-diffusion-xl-lightning';
      const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

      try {
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
            seed: seed ? Number(seed) : undefined,
          }),
        });

        if (!cfResponse.ok) {
          const errText = await cfResponse.text();
          let errorMessage = `Cloudflare AI API 响应错误 (${cfResponse.status})`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson.errors && errJson.errors.length > 0) {
              errorMessage += `: ${errJson.errors[0].message || errJson.errors[0].code}`;
            }
          } catch {
            errorMessage += `: ${errText.slice(0, 150)}`;
          }
          return NextResponse.json({ success: false, error: errorMessage }, { status: cfResponse.status });
        }

        const contentType = cfResponse.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const jsonResult = await cfResponse.json();
          if (jsonResult.result?.image) {
            const imgDataUrl = jsonResult.result.image.startsWith('data:')
              ? jsonResult.result.image
              : `data:image/png;base64,${jsonResult.result.image}`;
            return NextResponse.json({ success: true, data: { imageUrl: imgDataUrl } });
          }
        }

        const arrayBuffer = await cfResponse.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const mime = contentType.includes('image/jpeg') ? 'image/jpeg' : 'image/png';
        const dataUrl = `data:${mime};base64,${base64}`;

        return NextResponse.json({
          success: true,
          data: { imageUrl: dataUrl },
        });
      } catch (cfErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Cloudflare Workers AI 请求失败: ${cfErr?.message || '网络或接口连接异常'}`,
          },
          { status: 500 }
        );
      }
    }

    // 2. Custom SD WebUI / Private API Endpoint (if configured and active)
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
            width: Number(width) || 1024,
            height: Number(height) || 1024,
            steps: Number(steps) || 20,
            cfg_scale: Number(guidance) || 7.5,
            seed: seed || -1,
          }),
        });

        if (sdResponse.ok) {
          const sdJson = await sdResponse.json();
          if (sdJson.images && sdJson.images.length > 0) {
            const rawBase64 = sdJson.images[0];
            const dataUrl = rawBase64.startsWith('data:') ? rawBase64 : `data:image/png;base64,${rawBase64}`;
            return NextResponse.json({ success: true, data: { imageUrl: dataUrl } });
          }
        }
      } catch (sdErr: any) {
        console.warn('Custom SD Endpoint unreachable, using default AI compute pool', sdErr);
      }
    }

    // 3. Default Stable Diffusion / High Performance AI Engine (Pollinations SDXL Out-of-the-Box)
    try {
      const generatedSeed = seed || Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const pollinationsModel = model.startsWith('@cf/') ? 'flux' : model;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${generatedSeed}&nologo=true&model=${encodeURIComponent(
        pollinationsModel
      )}`;

      const polResponse = await fetch(pollinationsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)',
        },
      });

      if (!polResponse.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `AI 算力服务未响应 (${polResponse.status})，请稍后重试或切换算力节点。`,
          },
          { status: polResponse.status }
        );
      }

      const arrayBuffer = await polResponse.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      return NextResponse.json({
        success: true,
        data: { imageUrl: dataUrl },
      });
    } catch (polErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: `图像生成失败: ${polErr?.message || '无法连接到 AI 算力节点'}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '服务器处理生成请求时发生未知异常' },
      { status: 500 }
    );
  }
}

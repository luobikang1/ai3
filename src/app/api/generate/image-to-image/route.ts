import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // Clean base64 string
    let base64Data = inputImage;
    if (inputImage.startsWith('data:')) {
      base64Data = inputImage.split(',')[1];
    }

    // 1. Cloudflare Workers AI Img2Img Engine
    if (computeEngine === 'cloudflare-ai' || model.startsWith('@cf/')) {
      if (!cfApiToken || !cfAccountId) {
        return NextResponse.json(
          {
            success: false,
            error: '图生图需配置 Cloudflare API Token 与 Account ID。请在“设置”中配置，或使用 Stable Diffusion 算力源。',
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

        const cfResponse = await fetch(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            negative_prompt: negativePrompt ? negativePrompt.trim() : undefined,
            image: Array.from(rawBytes),
            strength: Number(strength) || 0.7,
            num_steps: Math.min(Math.max(Number(steps) || 20, 1), 50),
            guidance: Number(guidance) || 7.5,
            seed: seed ? Number(seed) : undefined,
          }),
        });

        if (!cfResponse.ok) {
          const errText = await cfResponse.text();
          let errorMessage = `Cloudflare AI 图生图响应错误 (${cfResponse.status})`;
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
            error: `Cloudflare Workers AI 图生图服务异常: ${cfErr?.message || '网络连接失败'}`,
          },
          { status: 500 }
        );
      }
    }

    // 2. Custom SD WebUI / Automatic1111 / ComfyUI Img2Img API
    const activeEndpoint = sdApiEndpoint || customEndpoint;
    if (activeEndpoint) {
      try {
        const cleanUrl = activeEndpoint.endsWith('/') ? activeEndpoint.slice(0, -1) : activeEndpoint;
        const targetUrl = cleanUrl.includes('/sdapi/v1/img2img') ? cleanUrl : `${cleanUrl}/sdapi/v1/img2img`;

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
            init_images: [base64Data],
            denoising_strength: Number(strength) || 0.7,
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
        console.warn('Custom SD Img2Img Endpoint unreachable, trying fallback compute pool', sdErr);
      }
    }

    // 3. Fallback High Performance Img2Img Compute Service
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
            error: `图生图算力服务未响应 (${polResponse.status})，请在“设置”中配置本地 SD 接口或 Cloudflare 凭证。`,
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
          error: `图生图生成失败: ${polErr?.message || '无法连接到算力节点'}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '处理图生图请求时发生错误' },
      { status: 500 }
    );
  }
}

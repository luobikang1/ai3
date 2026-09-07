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
      model = '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      steps = 20,
      guidance = 7.5,
      seed,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
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

    const isCloudflareModel = model.startsWith('@cf/');

    if (isCloudflareModel) {
      if (!cfApiToken || !cfAccountId) {
        return NextResponse.json(
          {
            success: false,
            error: '图生图需配置 Cloudflare API Token 与 Account ID。请在“设置”中配置，或使用公共模型。',
          },
          { status: 400 }
        );
      }

      // Convert input image base64 if needed
      let base64Clean = inputImage;
      if (inputImage.startsWith('data:')) {
        base64Clean = inputImage.split(',')[1];
      }
      const binaryString = atob(base64Clean);
      const rawImageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        rawImageBytes[i] = binaryString.charCodeAt(i);
      }

      const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${model}`;

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
            image: Array.from(rawImageBytes),
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

    // Public / Pollinations Fallback
    try {
      const generatedSeed = seed || Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${generatedSeed}&nologo=true&model=${encodeURIComponent(
        model
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
            error: `公共算力服务未响应 (${polResponse.status})，请重试`,
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
          error: `图生图生成失败: ${polErr?.message || '无法连接到算力平台'}`,
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

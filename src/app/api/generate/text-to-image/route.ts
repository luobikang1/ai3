import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      model = '@cf/bytedance/stable-diffusion-xl-lightning',
      steps = 20,
      guidance = 7.5,
      seed,
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: '请输入有效的正向提示词' },
        { status: 400 }
      );
    }

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    const isCloudflareModel = model.startsWith('@cf/');

    // 1. If it's a Cloudflare Workers AI model OR Cloudflare credentials provided
    if (isCloudflareModel) {
      if (!cfApiToken || !cfAccountId) {
        // If user picked a Cloudflare model but hasn't set credentials, give a clear instruction or fallback automatically
        return NextResponse.json(
          {
            success: false,
            error: '未配置 Cloudflare API Token 或 Account ID。请在“设置”页面中配置，或选择公共模型（如 FLUX.1）。',
          },
          { status: 400 }
        );
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

        // Standard Cloudflare AI binary image response
        const arrayBuffer = await cfResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
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

    // 2. Pollinations / Public AI API fallback mode
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
            error: `公共 AI 接口服务未响应 (${polResponse.status})，请稍后重试或使用 Cloudflare 模型。`,
          },
          { status: polResponse.status }
        );
      }

      const arrayBuffer = await polResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
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

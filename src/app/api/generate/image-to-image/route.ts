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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      prompt = 'cyberpunk white fox, detailed artwork',
      inputImage,
      strength = 0.65,
      model = 'flux',
      cfApiToken: clientCfToken,
      cfAccountId: clientCfAccount,
      enableNsfw = true,
    } = body;

    if (!inputImage) {
      return NextResponse.json(
        { success: false, error: '请先提供需要垫图重绘的参考图片' },
        { status: 400 }
      );
    }

    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // 1. CLOUDFLARE WORKERS AI IMG2IMG
    if (cfApiToken && cfAccountId && (model.startsWith('@cf/') || model === 'cloudflare')) {
      try {
        const cfModel = model.startsWith('@cf/') ? model : '@cf/bytedance/stable-diffusion-xl-lightning';
        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`;

        const base64Data = inputImage.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const cfRes = await fetchWithRetry(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            image: Array.from(bytes),
            strength: Number(strength) || 0.65,
            num_steps: 20,
          }),
          timeoutMs: 35000,
          maxRetries: 2,
        });

        if (cfRes.ok) {
          const contentType = cfRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await cfRes.json();
            if (json.result?.image) {
              const img = json.result.image.startsWith('data:')
                ? json.result.image
                : `data:image/png;base64,${json.result.image}`;
              return NextResponse.json({
                success: true,
                data: { imageUrl: img, providerUsed: 'Cloudflare Workers AI Img2Img' },
              });
            }
          }
          const arrayBuffer = await cfRes.arrayBuffer();
          const base64 = arrayBufferToBase64(arrayBuffer);
          return NextResponse.json({
            success: true,
            data: { imageUrl: `data:image/png;base64,${base64}`, providerUsed: 'Cloudflare Workers AI Img2Img' },
          });
        }
      } catch (e: any) {
        // Fallback
      }
    }

    // 2. POLLINATIONS FREE POOL UNIVERSAL COMPATIBILITY FALLBACK
    try {
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const encodedImage = encodeURIComponent(inputImage);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&strength=${strength}&nologo=true&safe=${!enableNsfw}&model=flux`;

      const polResponse = await fetchWithRetry(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)' },
        timeoutMs: 35000,
        maxRetries: 3,
      });

      if (polResponse.ok) {
        const arrayBuffer = await polResponse.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        return NextResponse.json({
          success: true,
          data: { imageUrl: `data:image/jpeg;base64,${base64}`, providerUsed: 'Pollinations Global Img2Img Pool' },
        });
      }
    } catch (e: any) {
      // Fallback
    }

    return NextResponse.json(
      { success: false, error: '垫图重绘处理失败，请检查参考图片或网络连接' },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Img2Img 服务异常' }, { status: 500 });
  }
}

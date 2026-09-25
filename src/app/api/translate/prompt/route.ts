import { NextRequest, NextResponse } from 'next/server';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = 'en', cfApiToken: clientCfToken, cfAccountId: clientCfAccount } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ success: false, error: '请输入待翻译的文本' }, { status: 400 });
    }

    const cleanText = text.trim();
    const cfApiToken = clientCfToken || process.env.CLOUDFLARE_API_TOKEN;
    const cfAccountId = clientCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID;

    // 1. Try Cloudflare LLM Translation if configured
    if (cfApiToken && cfAccountId) {
      try {
        const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
        const prompt = targetLang === 'en'
          ? `You are an expert AI art prompt translator. Translate the following Chinese prompt into descriptive, high-quality English image generation prompt keywords. Return ONLY the translated English text, without commentary or markdown quotes:\n\n${cleanText}`
          : `You are an expert translator. Translate the following English prompt into fluent Chinese text. Return ONLY the translated Chinese text:\n\n${cleanText}`;

        const res = await fetchWithRetry(cfEndpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
          }),
          timeoutMs: 10000,
          maxRetries: 1,
        });

        if (res.ok) {
          const json = await res.json();
          const translated = json?.result?.response?.trim();
          if (translated) {
            return NextResponse.json({
              success: true,
              data: { translatedText: translated.replace(/^["']|["']$/g, '') },
            });
          }
        }
      } catch (e) {
        // Fallback to public translation API
      }
    }

    // 2. Free Open MyMemory Translation API fallback
    try {
      const langPair = targetLang === 'en' ? 'zh|en' : 'en|zh';
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langPair}`;

      const res = await fetchWithRetry(myMemoryUrl, { timeoutMs: 8000, maxRetries: 2 });
      if (res.ok) {
        const json = await res.json();
        const translated = json?.responseData?.translatedText;
        if (translated && typeof translated === 'string') {
          return NextResponse.json({
            success: true,
            data: { translatedText: translated },
          });
        }
      }
    } catch (e) {
      // Fallback
    }

    // Return original if translation service fails
    return NextResponse.json({
      success: true,
      data: { translatedText: cleanText, fallbackUsed: true },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || '翻译失败' }, { status: 500 });
  }
}

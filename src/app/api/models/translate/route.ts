import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, targetLang = 'zh' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少需要翻译的文本' }, { status: 400 });
    }

    // Try MyMemory free translation API first
    try {
      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      const res = await fetch(apiUrl, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json?.responseData?.translatedText) {
          return NextResponse.json({
            success: true,
            data: { translatedText: json.responseData.translatedText, originalText: text },
          });
        }
      }
    } catch (err) {
      console.warn('MyMemory translation failed, falling back to original text', err);
    }

    // Fallback: Return original text gracefully without breaking
    return NextResponse.json({
      success: true,
      data: { translatedText: text, originalText: text },
      message: '使用原始名称',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '翻译接口出错' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || 'flux';

    // Query HuggingFace open-source model hub for text-to-image models
    const hfSearchUrl = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=text-to-image&sort=downloads&direction=-1&limit=20`;

    const res = await fetch(hfSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FoxAI/3.0)',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const models = await res.json();
    const formatted = (models || []).map((m: any) => ({
      id: m.id,
      name: m.id,
      translatedName: m.id.split('/')[1] || m.id,
      description: `HuggingFace 社区热门开源模型 (下载量: ${m.downloads || 0}, 喜爱: ${m.likes || 0})`,
      provider: 'huggingface' as const,
      hfModelPath: m.id,
      category: 'sdxl' as const,
      recommendedReason: `HuggingFace 开源模型 · 下载量 ${m.downloads || 0}`,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [], message: error?.message });
  }
}

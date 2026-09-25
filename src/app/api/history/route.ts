import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const env = (process.env as any) || {};
    const d1 = env.DB;

    if (!d1) {
      return NextResponse.json({
        success: false,
        history: [],
        message: '未配置 D1 数据库',
      });
    }

    const { results } = await d1
      .prepare('SELECT * FROM history ORDER BY created_at DESC LIMIT 50')
      .all();

    const formatted = (results || []).map((row: any) => ({
      id: row.id,
      imageUrl: row.image_url,
      modelName: row.model_name,
      createdAt: row.created_at,
      generationTimeMs: row.generation_time_ms,
      params: row.params_json ? JSON.parse(row.params_json) : {},
    }));

    return NextResponse.json({
      success: true,
      history: formatted,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, imageUrl, prompt, negativePrompt, modelName, params, generationTimeMs, createdAt } = body;

    const env = (process.env as any) || {};
    const d1 = env.DB;

    if (!d1) {
      return NextResponse.json({ success: false, message: 'D1 未绑定，跳过云端落库' });
    }

    await d1
      .prepare(
        'INSERT INTO history (id, image_url, prompt, negative_prompt, model_name, params_json, generation_time_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        id || `img_${Date.now()}`,
        imageUrl,
        prompt || '',
        negativePrompt || '',
        modelName || 'FLUX.1',
        JSON.stringify(params || {}),
        generationTimeMs || 1000,
        createdAt || Date.now()
      )
      .run();

    return NextResponse.json({ success: true, message: '历史记录已归档到 D1' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const env = (process as any).env || {};
    const db = env.DB || (globalThis as any).DB;

    if (!db) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '未挂载 D1 数据库，使用本地 IndexedDB 存储',
      });
    }

    const { results } = await db
      .prepare('SELECT * FROM history ORDER BY createdAt DESC LIMIT 100')
      .all();

    const formatted = (results || []).map((row: any) => ({
      id: row.id,
      imageUrl: row.imageUrl,
      params: {
        prompt: row.prompt,
        negativePrompt: row.negativePrompt,
        width: row.width,
        height: row.height,
        aspectRatio: row.aspectRatio,
        model: row.model,
        steps: row.steps,
        guidance: row.guidance,
      },
      createdAt: row.createdAt,
      modelName: row.modelName,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [], message: error?.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const env = (process as any).env || {};
    const db = env.DB || (globalThis as any).DB;

    if (!db) {
      return NextResponse.json({
        success: true,
        message: '本地模式存储成功',
      });
    }

    const item = await req.json();
    const { id, imageUrl = '', params, createdAt, modelName } = item;

    // D1 SQL statement size optimization: if imageUrl exceeds ~200KB, store a preview indicator
    // Full high-res image remains stored safely in local IndexedDB.
    let storedImageUrl = imageUrl;
    if (imageUrl.length > 200000) {
      storedImageUrl = imageUrl.substring(0, 100) + '...[IndexedDB_Local_Full_Res]';
    }

    await db
      .prepare(
        `INSERT OR REPLACE INTO history
        (id, imageUrl, prompt, negativePrompt, width, height, aspectRatio, model, steps, guidance, modelName, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        storedImageUrl,
        params?.prompt || '',
        params?.negativePrompt || '',
        params?.width || 1024,
        params?.height || 1024,
        params?.aspectRatio || '1:1',
        params?.model || '',
        params?.steps || 20,
        params?.guidance || 7.5,
        modelName || '',
        createdAt || Date.now()
      )
      .run();

    return NextResponse.json({ success: true, message: 'D1 数据库同步成功' });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: error?.message });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const env = (process as any).env || {};
    const db = env.DB || (globalThis as any).DB;

    if (!db) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await db.prepare('DELETE FROM history WHERE id = ?').bind(id).run();
    } else {
      await db.prepare('DELETE FROM history').run();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: error?.message });
  }
}

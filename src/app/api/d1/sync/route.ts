import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const env = (process.env as any) || {};
    const d1 = env.DB;

    if (!d1) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: '未绑定 Cloudflare D1 数据库变量 (env.DB)',
      });
    }

    const { results } = await d1.prepare('SELECT COUNT(*) as count FROM user_settings').all();
    return NextResponse.json({
      success: true,
      connected: true,
      dataCount: results?.[0]?.count || 0,
      message: 'Cloudflare D1 数据库连接正常，已同步激活',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: err.message || 'D1 数据库查询异常',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, username = 'admin', settingsData, favoritesData, historyData } = body;

    const env = (process.env as any) || {};
    const d1 = env.DB;

    if (!d1) {
      return NextResponse.json({
        success: false,
        message: '未配置 Cloudflare D1 数据库实例 (DB)',
      }, { status: 400 });
    }

    if (action === 'push') {
      if (settingsData) {
        await d1
          .prepare(
            'INSERT INTO user_settings (username, settings_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET settings_json = excluded.settings_json, updated_at = excluded.updated_at'
          )
          .bind(username, JSON.stringify(settingsData), Date.now())
          .run();
      }

      if (favoritesData) {
        await d1
          .prepare(
            'INSERT INTO user_favorites (username, favorites_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(username) DO UPDATE SET favorites_json = excluded.favorites_json, updated_at = excluded.updated_at'
          )
          .bind(username, JSON.stringify(favoritesData), Date.now())
          .run();
      }

      return NextResponse.json({
        success: true,
        message: '已成功手动同步增量设置与收藏到 Cloudflare D1！',
      });
    }

    if (action === 'pull') {
      const settingsRow = await d1.prepare('SELECT settings_json FROM user_settings WHERE username = ?').bind(username).first();
      const favRow = await d1.prepare('SELECT favorites_json FROM user_favorites WHERE username = ?').bind(username).first();

      return NextResponse.json({
        success: true,
        data: {
          settings: settingsRow?.settings_json ? JSON.parse(settingsRow.settings_json) : null,
          favorites: favRow?.favorites_json ? JSON.parse(favRow.favorites_json) : null,
        },
      });
    }

    return NextResponse.json({ success: false, error: '未知同步指令' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'D1 同步引擎出错' }, { status: 500 });
  }
}

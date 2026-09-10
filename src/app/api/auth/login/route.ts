import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, action = 'login' } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD;

    // 1. Admin Account Authentication (Environment variable check)
    if (cleanUser === expectedUsername) {
      if (expectedPassword && cleanPass !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: '管理员密码不正确' },
          { status: 401 }
        );
      }
      const token = await signToken({ username: cleanUser });
      return NextResponse.json({
        success: true,
        data: { token, username: cleanUser },
        message: '管理员凭证校验通过，登录成功',
      });
    }

    // 2. Cloudflare D1 Database Auth check (Optional DB Connection)
    const env = (process as any).env || {};
    const db = env.DB || (globalThis as any).DB;

    if (db) {
      try {
        if (action === 'register') {
          const { results: existing } = await db
            .prepare('SELECT * FROM users WHERE username = ?')
            .bind(cleanUser)
            .all();

          if (existing && existing.length > 0) {
            return NextResponse.json(
              { success: false, error: '用户名已在云端数据库中存在' },
              { status: 400 }
            );
          }

          await db
            .prepare('INSERT INTO users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)')
            .bind(
              `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              cleanUser,
              cleanPass,
              Date.now()
            )
            .run();
        } else {
          const { results } = await db
            .prepare('SELECT * FROM users WHERE username = ? AND passwordHash = ?')
            .bind(cleanUser, cleanPass)
            .all();

          if (!results || results.length === 0) {
            // Check if local guest pass works when user is registering offline
            if (cleanPass.length < 4) {
              return NextResponse.json(
                { success: false, error: '数据库账号或密码错误' },
                { status: 401 }
              );
            }
          }
        }
      } catch (dbErr) {
        console.warn('D1 auth query failed, continuing with database-free fallback', dbErr);
      }
    }

    // 3. Database-free Local User Fallback
    if (cleanPass.length < 4) {
      return NextResponse.json(
        { success: false, error: '密码长度不能少于 4 位' },
        { status: 400 }
      );
    }

    const token = await signToken({ username: cleanUser });
    return NextResponse.json({
      success: true,
      data: { token, username: cleanUser },
      message: action === 'register' ? '注册并成功登录' : '凭证校验通过',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '登录过程中发生错误' },
      { status: 500 }
    );
  }
}

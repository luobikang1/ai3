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

    // Default admin credentials if env vars are set
    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'foxai123';

    if (username === expectedUsername && password === expectedPassword) {
      const token = await signToken({ username });
      return NextResponse.json({
        success: true,
        data: {
          token,
          username,
        },
        message: '登录成功',
      });
    }

    // Database-free local user registration/login fallback:
    // Any user can register/login directly without traditional DB;
    // Password length must be at least 4 chars.
    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: '密码长度不能少于 4 位' },
        { status: 400 }
      );
    }

    const token = await signToken({ username });
    return NextResponse.json({
      success: true,
      data: {
        token,
        username,
      },
      message: action === 'register' ? '注册并自动登录成功' : '免数据库校验通过，已登录',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '登录或注册过程中发生错误' },
      { status: 500 }
    );
  }
}

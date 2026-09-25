import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    // Default admin username and fallback password if ADMIN_PASSWORD is not set in env
    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin888';

    if (cleanUser === expectedUsername) {
      if (cleanPass !== expectedPassword) {
        return NextResponse.json(
          { success: false, error: '管理员密码不正确，默认初始密码为 admin888' },
          { status: 401 }
        );
      }

      const token = await signToken({ username: cleanUser });
      return NextResponse.json({
        success: true,
        data: {
          token,
          username: cleanUser,
        },
      });
    }

    // Allow user guest/registration login with any username and minimum 4-char password
    if (cleanPass.length < 4) {
      return NextResponse.json(
        { success: false, error: '密码长度不能少于 4 位字符' },
        { status: 400 }
      );
    }

    const token = await signToken({ username: cleanUser });
    return NextResponse.json({
      success: true,
      data: {
        token,
        username: cleanUser,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '登录异常' },
      { status: 500 }
    );
  }
}

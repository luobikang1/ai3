import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    // Default admin credentials if env vars are not set
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
    } else {
      return NextResponse.json(
        { success: false, error: '用户名或密码不正确' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '登录过程中发生错误' },
      { status: 500 }
    );
  }
}

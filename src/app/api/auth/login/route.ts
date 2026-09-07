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

    // 1. Admin Account Authentication
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

    // 2. Regular Local User Login/Registration
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
      message: action === 'register' ? '注册并成功登录' : '通用凭证校验通过',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '登录过程中发生错误' },
      { status: 500 }
    );
  }
}

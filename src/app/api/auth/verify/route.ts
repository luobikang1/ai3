import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: '未提供有效 Token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const verified = await verifyToken(token);

    if (verified) {
      return NextResponse.json({
        success: true,
        data: { username: verified.username },
      });
    } else {
      return NextResponse.json({ success: false, error: 'Token 无效或已过期' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '验证失败' }, { status: 500 });
  }
}

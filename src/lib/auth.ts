import { SignJWT, jwtVerify } from 'jose';

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET || 'baihu-ai-3-default-secret-key-2025';
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { username: string }): Promise<string> {
  const secretKey = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return { username: payload.username as string };
  } catch {
    return null;
  }
}

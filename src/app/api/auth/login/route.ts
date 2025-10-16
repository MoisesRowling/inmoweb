import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { SignJWT } from 'jose';
import { serialize } from 'cookie';

const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret || secret.length < 32) {
        throw new Error('The JWT_SECRET_KEY environment variable must be at least 32 characters long.');
    }
    return new TextEncoder().encode(secret);
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const db = await readDB();
    const user = db.users.find((u: any) => u.email === email);

    if (user && password === user.password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userSafe } = user;
      
      // Create JWT token
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h') // Token expires in 1 hour
        .sign(getJwtSecretKey());

      const cookie = serialize('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });
      
      const response = NextResponse.json({ user: userSafe });
      response.headers.set('Set-Cookie', cookie);

      return response;

    }

    return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}

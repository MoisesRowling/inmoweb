import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Expire the cookie to log the user out
  const cookie = serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0), // Set expiry date to the past
    path: '/',
  });

  const response = NextResponse.json({ message: 'Cierre de sesión exitoso' });
  response.headers.set('Set-Cookie', cookie);
  return response;
}

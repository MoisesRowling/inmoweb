import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const db = await readDB();
    const user = db.users.find((u: any) => u.email === email);

    if (user && password === user.password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userSafe } = user;
      
      const response = NextResponse.json({ user: userSafe });
      return response;

    }

    return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor.' }, { status: 500 });
  }
}

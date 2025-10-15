import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  const db = await readDB();
  const user = db.users.find((u: any) => u.email === email && u.password === password);

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userSafe } = user;
    return NextResponse.json({ user: userSafe });
  }

  return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
}

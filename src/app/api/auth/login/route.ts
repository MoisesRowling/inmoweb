import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const dbPath = path.join(process.cwd(), 'db.json');

const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
     console.error("Error reading from db.json:", error);
     return { users: [] };
  }
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-bytes-long');

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  const db = readDB();
  const user = db.users.find((u: any) => u.email === email && u.password === password);

  if (user) {
    const { password, ...userSafe } = user;
    
    // Create JWT
    const token = await new SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(JWT_SECRET);
    
    // Set cookie
    cookies().set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });
        
    return NextResponse.json({ user: userSafe });
  }

  return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
}

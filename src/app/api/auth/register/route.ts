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
     return { users: [], balances: {} };
  }
};

const writeDB = (data: any) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
};

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key-that-is-at-least-32-bytes-long');

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  
  const db = readDB();

  if (db.users.find((u: any) => u.email === email)) {
    return NextResponse.json({ message: 'El correo electrónico ya está en uso.' }, { status: 409 });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    publicId: Math.floor(10000 + Math.random() * 90000).toString(),
    name,
    email,
    password, // In a real app, you would hash this password
  };

  db.users.push(newUser);
  // Initialize balance for new user with the new structure
  db.balances[newUser.id] = {
    amount: 0,
    lastUpdated: new Date().toISOString()
  };

  writeDB(db);

  const { password: _, ...userSafe } = newUser;

  // Create JWT
  const token = await new SignJWT({ userId: newUser.id })
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

  return NextResponse.json({ user: userSafe }, { status: 201 });
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function POST(request: Request) {
  const { payload } = await request.json();
  const { email, password } = payload;
  
  const db = readDB();
  const user = db.users.find((u: any) => u.email === email && u.password === password);

  if (user) {
    // In a real app, you'd return a JWT or session token.
    // Here, we return the user object (without password).
    const { password, ...userSafe } = user;
    return NextResponse.json({ user: userSafe });
  }

  return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
}

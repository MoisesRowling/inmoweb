import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    const db = await readDB();

    if (db.users.find((u: any) => u.email === email)) {
      return NextResponse.json({ message: 'El correo electrónico ya está en uso.' }, { status: 400 });
    }
    
    // Generate a unique ID for the user
    const newUserId = `user-${Date.now()}`;
    const newUser = {
      id: newUserId,
      publicId: String(Math.floor(10000 + Math.random() * 90000)),
      name,
      email,
      password: password, // Storing password in plain text as requested
    };
    
    const newBalance = {
      amount: 0,
      lastUpdated: new Date().toISOString(),
    };

    db.users.push(newUser);
    
    if (!db.balances) {
        db.balances = {};
    }
    db.balances[newUserId] = newBalance;

    await writeDB(db);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = newUser;
    // For registration, we don't need to return a token. The user will be redirected to login.
    return NextResponse.json({ user: userSafe }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor al intentar registrar la cuenta.' }, { status: 500 });
  }
}

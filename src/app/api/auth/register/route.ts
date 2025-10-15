import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
const CRUD_PASSWORD = process.env.CRUD_PASSWORD || "caballos1212";

// This function now reads the DB via the new CRUD API route
const readDB = async () => {
  const response = await fetch(`${API_URL}/api/crud`, {
    headers: { 'Authorization': CRUD_PASSWORD },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Failed to fetch DB');
  return response.json();
};

// This function now writes the DB via the new CRUD API route
const writeDB = async (data: any) => {
  const response = await fetch(`${API_URL}/api/crud`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': CRUD_PASSWORD
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to write DB');
};


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
      password, // In a real app, hash this password!
    };
    
    const newBalance = {
      amount: 0,
      lastUpdated: new Date().toISOString(),
    };

    db.users.push(newUser);
    db.balances[newUserId] = newBalance;

    await writeDB(db);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = newUser;
    return NextResponse.json({ user: userSafe }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor al intentar registrar la cuenta.' }, { status: 500 });
  }
}

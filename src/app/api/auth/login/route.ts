import { NextResponse } from 'next/server';

const DB_URL = 'https://satdevoluciones.com/db.json';

const readDB = async () => {
  try {
    const response = await fetch(DB_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to fetch db.json: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
     console.error("Error reading from remote db.json:", error);
     return { users: [] };
  }
};

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

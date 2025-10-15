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
     return { users: [], balances: {} };
  }
};

export async function POST(request: Request) {
  // Writing to a remote db.json is not possible. This function is now for demonstration purposes.
  return NextResponse.json({ message: 'El registro no está disponible con la fuente de datos actual.' }, { status: 403 });
}

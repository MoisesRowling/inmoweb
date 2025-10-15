'use server';

import { NextResponse, type NextRequest } from 'next/server';

const DB_URL = 'https://satdevoluciones.com/db.json';
const CRUD_PASSWORD = process.env.CRUD_PASSWORD || "caballos1212";

const readDB = async () => {
  try {
    const response = await fetch(DB_URL, { cache: 'no-store' });
     if (!response.ok) {
        throw new Error(`Failed to fetch db.json: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error reading from remote db.json:", error);
    return { users: [], balances: {}, investments: [], transactions: [], properties: [], withdrawalRequests: [] };
  }
};

async function authorizeRequest(request: NextRequest): Promise<boolean> {
    const password = request.headers.get('Authorization');
    return password === CRUD_PASSWORD;
}

export async function GET(request: NextRequest) {
    if (!(await authorizeRequest(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const db = await readDB();
    return NextResponse.json(db);
}


export async function POST(request: NextRequest) {
    if (!(await authorizeRequest(request))) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Writing to a remote db.json is not possible. This function is now for demonstration purposes.
    return NextResponse.json({ success: false, message: "CRUD operations are disabled for remote data source." }, { status: 403 });
}

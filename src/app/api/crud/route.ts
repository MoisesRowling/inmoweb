'use server';

import { NextResponse, type NextRequest } from 'next/server';

const DB_URL = 'https://satdevoluciones.com/db.json';
// A simple password to protect write operations.
// In a real-world scenario, this should be a more secure mechanism.
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
    // Return a default structure if reading fails to avoid crashing the app
    return { users: [], balances: {}, investments: [], transactions: [], properties: [], withdrawalRequests: [] };
  }
};

// This function will attempt to write the entire database back to the remote URL.
// This requires the server at DB_URL to be configured to accept POST requests and overwrite the file.
const writeDB = async (data: any) => {
    try {
        const response = await fetch(DB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We could add an authorization header if the remote server expects one
            },
            body: JSON.stringify(data, null, 2), // Pretty-print JSON
        });

        if (!response.ok) {
            throw new Error(`Failed to write to db.json: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error writing to remote db.json:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

// Higher-order function to protect routes
async function withDb(request: NextRequest, handler: (db: any, request: NextRequest) => Promise<NextResponse>) {
    const password = request.headers.get('Authorization');
    if (password !== CRUD_PASSWORD) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await readDB();
    return handler(db, request);
}


export async function GET(request: NextRequest) {
    const password = request.headers.get('Authorization');
    if (password !== CRUD_PASSWORD) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const db = await readDB();
    return NextResponse.json(db);
}


export async function POST(request: NextRequest) {
     const password = request.headers.get('Authorization');
    if (password !== CRUD_PASSWORD) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dataToWrite = await request.json();
        await writeDB(dataToWrite);
        return NextResponse.json({ success: true, message: "Database updated successfully." });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: `Failed to update database: ${error.message}` }, { status: 500 });
    }
}

'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const db = await readDB();
        return NextResponse.json(db);
    } catch (error: any) {
        return NextResponse.json({ message: `Failed to read database: ${error.message}` }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const dataToWrite = await request.json();
        await writeDB(dataToWrite);
        return NextResponse.json({ success: true, message: "Database updated successfully." });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: `Failed to update database: ${error.message}` }, { status: 500 });
    }
}

'use server';

import { type NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret || secret.length < 32) {
        throw new Error('The JWT_SECRET_KEY environment variable must be at least 32 characters long.');
    }
    return new TextEncoder().encode(secret);
};

interface AuthPayload extends JWTPayload {
    userId: string;
    email: string;
}

export async function verifyAuth(request: NextRequest): Promise<{ userId: string | null; error?: string; status?: number }> {
    const token = request.cookies.get('session')?.value;

    if (!token) {
        return { userId: null, error: 'Missing session token', status: 401 };
    }

    try {
        const { payload } = await jwtVerify<AuthPayload>(token, getJwtSecretKey());
        return { userId: payload.userId };
    } catch (err) {
        console.error('JWT Verification Error:', err);
        return { userId: null, error: 'Your session has expired. Please log in again.', status: 401 };
    }
}

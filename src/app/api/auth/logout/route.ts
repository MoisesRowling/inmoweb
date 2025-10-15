import { NextResponse } from 'next/server';

// This is now handled on the client by removing the user from localStorage.
// This route can be kept for completeness but doesn't need to do anything
// with cookies if the session isn't cookie-based.
export async function POST() {
  return NextResponse.json({ message: 'Logged out successfully' });
}

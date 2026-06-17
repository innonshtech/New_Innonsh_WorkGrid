import { NextResponse } from 'next/server';

export async function GET(req) {
  console.log("API /api/test_ping HIT");
  return NextResponse.json({ message: 'pong', timestamp: new Date().toISOString() });
}

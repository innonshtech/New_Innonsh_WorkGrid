import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Test Session Route Hit");
    return NextResponse.json({ message: "Test route working", time: new Date().toISOString() });
}

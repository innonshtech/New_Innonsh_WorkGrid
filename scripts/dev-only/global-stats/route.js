import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("--- Debug Info API Hit ---");
    return NextResponse.json({
        env: {
            NODE_ENV: process.env.NODE_ENV,
            JWT_SECRET_SET: !!process.env.JWT_SECRET,
            MONGODB_URI_SET: !!process.env.MONGODB_URI,
        },
        time: new Date().toISOString()
    });
}

import { NextResponse } from 'next/server';
import { getAuthUser, authorize } from '@/lib/auth-util';
import { generateJD } from '@/lib/ai/gemini';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const body = await request.json();
        const { title, department, type, location, seniority } = body;

        if (!title || !department) {
            return NextResponse.json({ success: false, error: "Title and department are required" }, { status: 400 });
        }

        const result = await generateJD({ title, department, type, location, seniority });

        return NextResponse.json({
            success: true,
            data: result,
            message: "AI-generated job description ready"
        });
    } catch (error) {
        console.error("AI GENERATE JD ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

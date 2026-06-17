import { NextResponse } from 'next/server';
import { getAuthUser, authorize } from '@/lib/auth-util';
import { parseResume } from '@/lib/ai/gemini';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const body = await request.json();
        const { resumeText } = body;

        if (!resumeText || resumeText.trim().length < 50) {
            return NextResponse.json({ 
                success: false, 
                error: "Resume text is required (minimum 50 characters)" 
            }, { status: 400 });
        }

        const result = await parseResume(resumeText);

        return NextResponse.json({
            success: true,
            data: result,
            message: "Resume parsed successfully"
        });
    } catch (error) {
        console.error("AI PARSE RESUME ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

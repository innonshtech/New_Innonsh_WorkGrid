import { NextResponse } from 'next/server';
import { getAuthUser, authorize } from '@/lib/auth-util';
import { generateOfferLetter } from '@/lib/ai/gemini';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const body = await request.json();
        const { candidateName, jobTitle, department, salary, joiningDate, companyName } = body;

        if (!candidateName || !jobTitle || !joiningDate) {
            return NextResponse.json({ 
                success: false, 
                error: "candidateName, jobTitle, and joiningDate are required" 
            }, { status: 400 });
        }

        const result = await generateOfferLetter({ 
            candidateName, jobTitle, department, salary, joiningDate, companyName 
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "AI offer letter generated"
        });
    } catch (error) {
        console.error("AI GENERATE OFFER ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

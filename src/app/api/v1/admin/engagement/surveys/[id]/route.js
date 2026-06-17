import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function DELETE(req, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "company_admin", "super_admin", "hr"]);

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ success: false, message: 'Survey ID is required' }, { status: 400 });
        }

        const survey = await prisma.pulseSurvey.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });

        if (!survey) {
            return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        }

        // Delete the survey
        const deletedSurvey = await prisma.pulseSurvey.delete({
            where: { id: survey.id }
        });

        // Delete any responses associated with this survey in-memory to avoid crashes on nonexistent schema columns
        const allResponses = await prisma.pulseResponse.findMany();
        const responseIdsToDelete = allResponses.filter(r => {
            const mData = r.modelData || {};
            return mData.surveyId === deletedSurvey.id || mData.surveyId === deletedSurvey.mongoId;
        }).map(r => r.id);

        if (responseIdsToDelete.length > 0) {
            await prisma.pulseResponse.deleteMany({
                where: { id: { in: responseIdsToDelete } }
            });
        }

        return NextResponse.json({ success: true, message: 'Survey deleted successfully' });
    } catch (error) {
        console.error('Delete survey error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}

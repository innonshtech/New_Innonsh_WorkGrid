import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/service';
import { getSurveyTemplate } from '@/lib/email/templates/index';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

        let query = {};
        if (authUser.role === 'employee') {
            // For employees, only show published surveys
            query.status = 'Published';
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        const allSurveys = await prisma.pulseSurvey.findMany({
            where: {
                ...query,
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        const surveys = allSurveys.map(s => {
            const data = s.surveyData && typeof s.surveyData === 'object' ? s.surveyData : {};
            return {
                _id: s.id,
                id: s.id,
                mongoId: s.mongoId,
                organizationId: s.organizationId,
                title: s.title,
                status: s.status,
                ...data,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            };
        });

        return NextResponse.json({ success: true, surveys });
    } catch (error) {
        console.error('Fetch surveys error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const body = await req.json();
        const { title, status = 'Draft', ...rest } = body;

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;

        const survey = await prisma.pulseSurvey.create({
            data: {
                title,
                status,
                organizationId: org ? org.id : authUser.organizationId,
                surveyData: {
                    ...rest,
                    createdBy: authUser.id
                }
            }
        });

        // Trigger email notification if survey is published
        if (survey.status === 'Published') {
            const dashboardUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
            // Fetch all employees with emails in the organization
            const employees = await prisma.employee.findMany({
                where: {
                    organizationId: org ? org.id : authUser.organizationId,
                    email: { not: "" }
                },
                select: {
                    email: true
                }
            });
            const emails = employees.map(emp => emp.email).filter(Boolean);

            if (emails.length > 0) {
                const emailHtml = getSurveyTemplate(survey.title, dashboardUrl);
                await sendEmail({
                    to: emails,
                    subject: `New Pulse Survey: ${survey.title}`,
                    html: emailHtml
                });
            }
        }

        const formatted = {
            _id: survey.id,
            id: survey.id,
            mongoId: survey.mongoId,
            organizationId: survey.organizationId,
            title: survey.title,
            status: survey.status,
            ...(survey.surveyData || {})
        };

        return NextResponse.json({ success: true, survey: formatted }, { status: 201 });
    } catch (error) {
        console.error('Create survey error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);
        
        const { searchParams } = new URL(req.url);
        const surveyId = searchParams.get('surveyId');

        // Resolve survey UUID / MongoID
        let targetSurveyId = surveyId;
        let targetSurveyMongoId = null;
        if (surveyId) {
            const survey = await prisma.pulseSurvey.findFirst({
                where: { OR: [{ id: surveyId }, { mongoId: surveyId }] }
            });
            if (survey) {
                targetSurveyId = survey.id;
                targetSurveyMongoId = survey.mongoId;
            }
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        // Fetch all responses under organization
        const allResponses = await prisma.pulseResponse.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        // Filter responses in-memory
        let responses = allResponses;
        if (surveyId) {
            responses = responses.filter(r => {
                const mData = r.modelData || {};
                return mData.surveyId === targetSurveyId || mData.surveyId === targetSurveyMongoId || mData.surveyId === surveyId;
            });
        }

        if (authUser.role === 'employee') {
            // Employee: Fetch only their responses
            responses = responses.filter(r => {
                const mData = r.modelData || {};
                return r.employeeId === authUser.id || r.employeeId === authUser.mongoId || mData.employee === authUser.id || mData.employee === authUser.mongoId;
            });
        }

        // Hydrate employees details in memory for mapping response authors
        const employees = await prisma.employee.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });
        const employeeMap = {};
        const employeeMongoMap = {};
        employees.forEach(emp => {
            employeeMap[emp.id] = emp;
            if (emp.mongoId) {
                employeeMongoMap[emp.mongoId] = emp;
            }
        });

        // Map and flatten responses matching Mongoose populated output structure
        const mappedResponses = responses.map(response => {
            const mData = response.modelData && typeof response.modelData === 'object' ? response.modelData : {};
            const empId = response.employeeId || mData.employee;
            const emp = employeeMap[empId] || employeeMongoMap[empId] || null;

            const employeeInfo = emp ? {
                _id: emp.id,
                id: emp.id,
                employeeId: emp.employeeId,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName
                }
            } : null;

            return {
                _id: response.id,
                id: response.id,
                mongoId: response.mongoId,
                organizationId: response.organizationId,
                status: response.status,
                ...mData,
                employeeId: employeeInfo, // Populated object for legacy compatibility
                createdAt: response.createdAt,
                updatedAt: response.updatedAt
            };
        });

        return NextResponse.json({ success: true, responses: mappedResponses });
    } catch (error) {
        console.error('Fetch responses error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);
        
        const body = await req.json();

        if (!body.surveyId) {
            return NextResponse.json({ success: false, message: 'Survey ID is required' }, { status: 400 });
        }

        // Resolve survey details to block duplicates robustly
        let targetSurveyId = body.surveyId;
        let targetSurveyMongoId = null;
        const survey = await prisma.pulseSurvey.findFirst({
            where: { OR: [{ id: body.surveyId }, { mongoId: body.surveyId }] }
        });
        if (survey) {
            targetSurveyId = survey.id;
            targetSurveyMongoId = survey.mongoId;
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        // Prevent duplicate responses for the same survey
        const allResponses = await prisma.pulseResponse.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        const existing = allResponses.find(r => {
            const mData = r.modelData || {};
            const matchesEmployee = r.employeeId === authUser.id || r.employeeId === authUser.mongoId || mData.employee === authUser.id || mData.employee === authUser.mongoId;
            const matchesSurvey = mData.surveyId === targetSurveyId || mData.surveyId === targetSurveyMongoId || mData.surveyId === body.surveyId;
            return matchesEmployee && matchesSurvey;
        });

        if (existing) {
            return NextResponse.json({ success: false, message: 'You have already submitted a response for this survey' }, { status: 400 });
        }

        const response = await prisma.pulseResponse.create({
            data: {
                employeeId: authUser.id,
                organizationId: org ? org.id : authUser.organizationId,
                status: 'Active',
                modelData: {
                    ...body,
                    employee: authUser.id,
                    submittedAt: new Date().toISOString()
                }
            }
        });

        const formatted = {
            _id: response.id,
            id: response.id,
            mongoId: response.mongoId,
            organizationId: response.organizationId,
            status: response.status,
            ...(response.modelData || {})
        };

        return NextResponse.json({ success: true, response: formatted }, { status: 201 });
    } catch (error) {
        console.error('Submit response error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}
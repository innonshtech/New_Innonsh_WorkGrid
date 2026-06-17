import { NextResponse } from "next/server";

import prisma from '@/lib/db/prisma';


import { logActivity } from "@/lib/logger";
import { getAuthUser } from "@/lib/auth-util";
import { calculateEffectiveLeaveDays } from "@/lib/utils/leave-calculator";
import { sendEmail } from "@/lib/email/service";

console.log("🚀 Initializing Leave Applications API Route");

// GET leave applications for the logged-in employee
export async function GET(request) {
    try {
        const authUser = await getAuthUser();
                // Find correct employee document
        let employeeDoc = null;
        if (true) {
            employeeDoc = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
            
            // Fallback: Check if it's a User _id
            if (!employeeDoc) {
                const userRecord = await prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
                if (userRecord && userRecord.employeeId) {
                    employeeDoc = await prisma.employee.findFirst({ where: { employeeId: userRecord.employeeId } });
                }
            }
        }
        
        if (!employeeDoc) {
            return NextResponse.json({ applications: [], message: "No employee profile found" });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const rawApplications = await prisma.leaveApplication.findMany({ 
            where: { employeeId: employeeDoc.id } 
        });
        let applications = rawApplications.map(app => ({
            _id: app.id,
            status: app.modelData?.status || app.status,
            ...(app.modelData || {})
        }));

        if (status) {
            applications = applications.filter(app => app.status === status);
        }

        return NextResponse.json({ applications });
    } catch (error) {
        console.error("Error in GET /api/v1/employee/leaves/applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// SUBMIT a new leave application (Employee Self Service)
export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const {
            leaveType,
            leaveCategory,
            startDate,
            endDate,
            reason,
            contactNumber,
            addressDuringLeave,
            isAdvanceLeave,
            attachments,
            selectedApproverIds = []
        } = body;

        // 1. Resolve Employee Profile (Robust match)
        let employee = null;
        if (true) {
            employee = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
            
            if (!employee) {
                const userRecord = await prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
                if (userRecord && userRecord.employeeId) {
                    employee = await prisma.employee.findFirst({ where: { employeeId: userRecord.employeeId } });
                }
            }
        }

        if (!employee) {
            return NextResponse.json({ error: "Employee profile not found. Please contact HR." }, { status: 404 });
        }

        // 3. Force Recalculate Actual Deductible Days using correct Employee id
        const calcResult = await calculateEffectiveLeaveDays(employee.id, startDate, endDate);
        let actualLeaveDays = calcResult.totalEffectiveDays;

        if (leaveType === 'WFH') {
            actualLeaveDays = 0;
        } else if (leaveType === 'Half Day') {
            actualLeaveDays = actualLeaveDays * 0.5;
        }
        
        // 3. Build Approval Chain based on selection
        const approvalChain = [];
        let finalApproverId = null;

        const managerId = employee.reportingManager;
        const teamLeadId = employee.teamLead;

        // Add Team Lead if selected and assigned
        if (teamLeadId && selectedApproverIds.includes(teamLeadId)) {
            approvalChain.push({
                level: 'Team Lead',
                approverId: teamLeadId,
                status: 'Pending'
            });
            finalApproverId = teamLeadId;
        }

        // Add Manager if selected and assigned
        if (managerId && selectedApproverIds.includes(managerId)) {
            approvalChain.push({
                level: 'Manager',
                approverId: managerId,
                status: 'Pending'
            });
            finalApproverId = managerId;
        }

        // Add Custom Approvers from selection
        for (const id of selectedApproverIds) {
            // Already added as TL or Manager
            if (id === managerId || id === teamLeadId) continue;

            approvalChain.push({
                level: 'Selected Approver',
                approverId: id,
                status: 'Pending'
            });
            
            if (!finalApproverId || finalApproverId === teamLeadId) {
                finalApproverId = id;
            }
        }

        // Final supremacy check: Manager ALWAYS takes final if present in chain
        if (managerId && selectedApproverIds.includes(managerId)) {
            finalApproverId = managerId;
        }

        const modelData = {
            employee: employee.id,
            leaveType,
            leaveCategory: leaveCategory || undefined,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            totalDays: actualLeaveDays,
            reason,
            contactNumber,
            addressDuringLeave,
            isAdvanceLeave,
            attachments: attachments || [],
            status: "Pending",
            approvalChain,
            finalApproverId
        };

        const newAppRecord = await prisma.leaveApplication.create({
            data: {
                employeeId: employee.id,
                organizationId: employee.organizationId || authUser.organizationId,
                status: "Pending",
                modelData
            }
        });

        const application = {
            _id: newAppRecord.id,
            status: newAppRecord.status,
            ...(newAppRecord.modelData || {})
        };

        // Log activity
        await logActivity({
            action: "created",
            entity: "LeaveApplication",
            entityId: newAppRecord.id,
            description: `Employee ${employee?.firstName} submitted a leave application (${actualLeaveDays} days)`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name
            },
            req: request
        });

        // 2. Dual Notification System (HR & Manager)
        const emailPromises = [];
        
        // Find HR/Admins for this organization
        const hrAdmins = await prisma.user.findMany({ where: { 
            organizationId: authUser.organizationId, 
            role: 'admin', 
            status: 'active'
        } });
        const hrEmails = hrAdmins.map(admin => admin.email).filter(Boolean);

        const emailContent = `
            <h2>New Leave Application Pending</h2>
            <p><strong>Employee:</strong> ${employee?.firstName} ${employee?.lastName}</p>
            <p><strong>Type:</strong> ${leaveCategory ? `${leaveCategory} (${leaveType})` : leaveType}</p>
            <p><strong>Dates:</strong> ${new Date(startDate).toDateString()} to ${new Date(endDate).toDateString()}</p>
            <p><strong>Deductible Days:</strong> ${actualLeaveDays}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <br/>
            <p>Please log in to the portal to review and approve.</p>
        `;

        // Email to Global HR/Admins
        if (hrEmails.length > 0) {
            emailPromises.push(sendEmail({
                to: hrEmails.join(','),
                subject: "Leave Application Pending Approval",
                html: emailContent
            }));
        }

        // Email to Selected Approvers
        if (selectedApproverIds.length > 0) {
            const approvers = await prisma.employee.findMany({ 
                where: { 
                    id: { in: selectedApproverIds } 
                } 
            });
            for (const approver of approvers) {
                const approverUser = await prisma.user.findFirst({ where: { employeeId: approver.id } });
                if (approverUser && approverUser.email) {
                    emailPromises.push(sendEmail({
                        to: approverUser.email,
                        subject: "Action Required: Your Team Member's Leave Request",
                        html: emailContent
                    }));
                }
            }
        }

        Promise.allSettled(emailPromises);

        return NextResponse.json({ success: true, application }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/v1/employee/leaves/applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

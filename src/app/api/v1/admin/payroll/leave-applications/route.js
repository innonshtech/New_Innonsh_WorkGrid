import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";
import { calculateEffectiveLeaveDays } from "@/lib/utils/leave-calculator";
import { sendEmail } from "@/lib/email/service";
import { resolveOrgIds } from "@/lib/utils/flatten-model";

export const dynamic = 'force-dynamic';

// GET leave applications
export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");
        const managerId = searchParams.get("managerId");

        let filter = {};
        
        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgIds = await resolveOrgIds(authUser.organizationId);
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: { in: orgIds } },
                select: { id: true, mongoId: true }
            });
            const orgEmployeeIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
            filter.employeeId = { in: orgEmployeeIds };
        } else if (managerId) {
            let managerEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: managerId }, { mongoId: managerId }] } });
            if (!managerEmployee) {
                const userRecord = await prisma.user.findFirst({ where: { OR: [{ id: managerId }, { mongoId: managerId }] } });
                if (userRecord && userRecord.employeeId) {
                    managerEmployee = await prisma.employee.findFirst({ where: { employeeId: userRecord.employeeId } });
                }
            }
            
            if (managerEmployee) {
                const managedEmployees = await prisma.employee.findMany({
                    where: { reportingManager: { in: [managerEmployee.id, managerEmployee.mongoId].filter(Boolean) } },
                    select: { id: true, mongoId: true }
                });
                const managedEmployeeIds = managedEmployees.map(e => e.id).concat(managedEmployees.map(e => e.mongoId).filter(Boolean));
                filter.employeeId = { in: managedEmployeeIds };
            } else {
                return NextResponse.json({ applications: [] });
            }
        } else if (authUser.role === "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }, { employeeId: authUser.employeeId }] },
                select: { id: true, mongoId: true }
            });
            if (emp) {
                filter.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
            } else {
                filter.employeeId = authUser.id;
            }
        }

        if (employeeId && authUser.role !== "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true, mongoId: true }
            });
            if (emp) {
                filter.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
            } else {
                filter.employeeId = employeeId;
            }
        }
        if (status) filter.status = status;

        let applications = await prisma.leaveApplication.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });

        // Flatten modelData
        let flattenedApplications = applications.map(app => {
            const { modelData, ...rest } = app;
            return {
                id: app.id,
                _id: app.id,
                mongoId: app.mongoId,
                employeeId: app.employeeId,
                organizationId: app.organizationId,
                status: app.status,
                createdAt: app.createdAt,
                updatedAt: app.updatedAt,
                ...(modelData || {})
            };
        });

        // Enrich with employee details
        const empIds = [...new Set(flattenedApplications.map(app => app.employee || app.employeeId).filter(Boolean))];
        if (empIds.length > 0) {
            const employees = await prisma.employee.findMany({
                where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] },
                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true }
            });
            const empMap = new Map();
            employees.forEach(e => {
                empMap.set(e.id, e);
                if (e.mongoId) empMap.set(e.mongoId, e);
            });

            flattenedApplications = flattenedApplications.map(app => {
                const empKey = app.employee || app.employeeId;
                const emp = empKey ? empMap.get(empKey) : null;
                const empObj = emp ? {
                    _id: emp.id,
                    id: emp.id,
                    employeeId: emp.employeeId,
                    personalDetails: { firstName: emp.firstName, lastName: emp.lastName }
                } : null;

                return {
                    ...app,
                    employee: empObj,
                    employeeId: empObj
                };
            });
        }

        // Post-filter for manager approval chain matching (if managerId was provided)
        if (managerId && !employeeId) {
            const managerEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: managerId }, { mongoId: managerId }] } });
            if (managerEmployee) {
                const allOrgApps = await prisma.leaveApplication.findMany({
                    orderBy: { createdAt: 'desc' }
                });
                
                const directIds = new Set(flattenedApplications.map(a => a.id));
                for (const app of allOrgApps) {
                    if (directIds.has(app.id)) continue;
                    const appData = app.modelData || {};
                    const chain = appData.approvalChain || [];
                    const isInChain = chain.some(s => s.approverId?.toString() === managerEmployee.id || s.approverId?.toString() === managerEmployee.mongoId);
                    const isFinalApprover = [managerEmployee.id, managerEmployee.mongoId].filter(Boolean).includes(appData.finalApproverId);
                    
                    if (isInChain || isFinalApprover) {
                        const { modelData, ...rest } = app;
                        const flatApp = {
                            id: app.id,
                            _id: app.id,
                            mongoId: app.mongoId,
                            employeeId: app.employeeId,
                            organizationId: app.organizationId,
                            status: app.status,
                            createdAt: app.createdAt,
                            updatedAt: app.updatedAt,
                            ...(modelData || {})
                        };
                        
                        // Populate employee details for this extra app
                        const empKey = flatApp.employee || flatApp.employeeId;
                        if (empKey) {
                            const emp = await prisma.employee.findFirst({
                                where: { OR: [{ id: empKey }, { mongoId: empKey }] },
                                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true }
                            });
                            if (emp) {
                                const empObj = {
                                    _id: emp.id,
                                    id: emp.id,
                                    employeeId: emp.employeeId,
                                    personalDetails: { firstName: emp.firstName, lastName: emp.lastName }
                                };
                                flatApp.employee = empObj;
                                flatApp.employeeId = empObj;
                            }
                        }
                        flattenedApplications.push(flatApp);
                    }
                }
            }
        }

        return NextResponse.json({ applications: flattenedApplications });
    } catch (error) {
        console.error("Error in GET /api/payroll/leave-applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// SUBMIT a new leave application
export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const {
            employeeId,
            leaveType,
            leaveCategory,
            startDate,
            endDate,
            totalDays,
            reason,
            contactNumber,
            addressDuringLeave,
            isAdvanceLeave,
            attachments
        } = body;

        if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const calcResult = await calculateEffectiveLeaveDays(employeeId, startDate, endDate);
        let actualLeaveDays = calcResult.totalEffectiveDays;

        if (leaveType === 'WFH') {
            actualLeaveDays = 0;
        } else if (leaveType === 'Half Day') {
            actualLeaveDays = actualLeaveDays * 0.5;
        }

        const employee = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }] } });
        if (!employee) {
            return NextResponse.json(
                { error: "Employee not found" },
                { status: 404 }
            );
        }

        if (authUser.role === "admin") {
            const authOrgIds = await resolveOrgIds(authUser.organizationId);
            if (!authOrgIds.includes(employee.organizationId)) {
                return NextResponse.json({ error: "Forbidden: Cannot apply leave for employee in another organization" }, { status: 403 });
            }
        }

        const modelData = {
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
            employee: employee.id
        };

        const application = await prisma.leaveApplication.create({
            data: {
                employeeId: employee.id,
                organizationId: employee.organizationId,
                status: "Pending",
                modelData
            }
        });

        await logActivity({
            action: "created",
            entity: "LeaveApplication",
            entityId: application.id,
            description: `New leave application from ${employee.firstName} ${employee.lastName} (${actualLeaveDays} days)`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name
            },
            req: request
        });

        const emailPromises = [];
        const hrAdmins = await prisma.user.findMany({ where: { role: 'admin', isActive: true } });
        const hrEmails = hrAdmins.map(admin => admin.email).filter(Boolean);

        const emailContent = `
            <h2>New Leave Application Pending</h2>
            <p><strong>Employee:</strong> ${employee.firstName} ${employee.lastName}</p>
            <p><strong>Type:</strong> ${leaveCategory ? `${leaveCategory} (${leaveType})` : leaveType}</p>
            <p><strong>Dates:</strong> ${new Date(startDate).toDateString()} to ${new Date(endDate).toDateString()}</p>
            <p><strong>Deductible Days:</strong> ${actualLeaveDays}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <br/>
            <p>Please log in to the portal to review and approve.</p>
        `;

        if (hrEmails.length > 0) {
            emailPromises.push(sendEmail({
                to: hrEmails.join(','),
                subject: "Leave Application Pending Approval",
                html: emailContent
            }));
        }

        const reportingManagerId = employee.reportingManager;
        if (reportingManagerId) {
            const managerUser = await prisma.user.findFirst({ where: { OR: [{ id: reportingManagerId }, { mongoId: reportingManagerId }] } });
            if (managerUser && managerUser.email) {
                emailPromises.push(sendEmail({
                    to: managerUser.email,
                    subject: "Action Required: Your Team Member's Leave Request",
                    html: emailContent
                }));
            }
        }

        Promise.allSettled(emailPromises);

        const responseObj = {
            ...application,
            _id: application.id,
            ...(application.modelData || {})
        };

        return NextResponse.json({ success: true, application: responseObj }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/payroll/leave-applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

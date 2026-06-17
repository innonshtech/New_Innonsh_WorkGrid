import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/service";
import { getSystemNotificationTemplate } from "@/lib/email/templates";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}


async function getUserFromRequest(req) {
    const token = req.cookies.get("authToken")?.value || req.cookies.get("employee_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function GET(req) {
    const user = await getUserFromRequest(req);

    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        let where = {};

        if (user.role !== 'admin') {
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: user.id }, { mongoId: user.id }] } });
            // Or configData.employees contains user.id ... filtering JSON arrays is hard in basic Prisma where
            // For now we fetch matching employeeId
            if (emp) where.employeeId = emp.id;
        }

        // Fetch organization details for tenant mapping
        let allowedOrgIds = new Set();
        if (user.organizationId) {
            const userOrg = await prisma.organization.findFirst({
                where: {
                    OR: [
                        ...(isValidUUID(user.organizationId) ? [{ id: user.organizationId }] : []),
                        { mongoId: user.organizationId }
                    ]
                }
            });
            if (userOrg) {
                allowedOrgIds.add(userOrg.id);
                if (userOrg.mongoId) allowedOrgIds.add(userOrg.mongoId);
            }
        }

        const notificationsDocs = await prisma.notificationConfig.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 500
        });

        // Collect IDs for population
        const empIdsToFetch = new Set();
        const orgIdsToFetch = new Set();
        
        notificationsDocs.forEach(n => {
            const d = n.configData || {};
            if (n.employeeId) empIdsToFetch.add(n.employeeId);
            if (d.employee) empIdsToFetch.add(d.employee);
            if (Array.isArray(d.employees)) d.employees.forEach(id => empIdsToFetch.add(id));
            if (d.organization) orgIdsToFetch.add(d.organization);
        });

        const validEmpUUIDs = [...empIdsToFetch].filter(isValidUUID);
        const emps = await prisma.employee.findMany({
            where: { 
                OR: [
                    ...(validEmpUUIDs.length > 0 ? [{ id: { in: validEmpUUIDs } }] : []),
                    { mongoId: { in: [...empIdsToFetch] } }
                ] 
            }
        });
        const empMap = {};
        emps.forEach(e => {
            const data = { 
                _id: e.id, 
                organizationId: e.organizationId,
                personalDetails: { 
                    firstName: e.firstName || e.personalDetails?.firstName, 
                    lastName: e.lastName || e.personalDetails?.lastName 
                } 
            };
            empMap[e.id] = data;
            if (e.mongoId) empMap[e.mongoId] = data;
        });

        const validOrgUUIDs = [...orgIdsToFetch].filter(isValidUUID);
        const orgs = await prisma.organization.findMany({
            where: { 
                OR: [
                    ...(validOrgUUIDs.length > 0 ? [{ id: { in: validOrgUUIDs } }] : []),
                    { mongoId: { in: [...orgIdsToFetch] } }
                ] 
            }
        });
        const orgMap = {};
        orgs.forEach(o => {
            const data = { _id: o.id, name: o.name };
            orgMap[o.id] = data;
            if (o.mongoId) orgMap[o.mongoId] = data;
        });

        // Apply tenant isolation filtering in-memory
        const filteredDocs = notificationsDocs.filter(n => {
            if (user.role === 'super_admin') return true;
            if (allowedOrgIds.size === 0) return true; // Fallback if no org assigned

            const d = n.configData || {};
            
            // Check if organization field matches
            if (d.organization && allowedOrgIds.has(d.organization)) {
                return true;
            }

            // Fallback: check if the employee belongs to this organization
            if (n.employeeId && empMap[n.employeeId] && allowedOrgIds.has(empMap[n.employeeId].organizationId)) {
                return true;
            }
            if (d.employee && empMap[d.employee] && allowedOrgIds.has(empMap[d.employee].organizationId)) {
                return true;
            }
            if (Array.isArray(d.employees)) {
                return d.employees.some(empId => empMap[empId] && allowedOrgIds.has(empMap[empId].organizationId));
            }

            return false;
        }).slice(0, 50);

        const formattedNotifications = filteredDocs.map(n => {
            const d = typeof n.configData === 'object' && n.configData !== null ? n.configData : {};
            const isRead = Array.isArray(d.readBy) ? d.readBy.includes(user.id) : (d.read || false);
            
            let singleEmpName = null;
            if (n.employeeId && empMap[n.employeeId]) singleEmpName = `${empMap[n.employeeId].personalDetails.firstName} ${empMap[n.employeeId].personalDetails.lastName}`;
            else if (d.employee && empMap[d.employee]) singleEmpName = `${empMap[d.employee].personalDetails.firstName} ${empMap[d.employee].personalDetails.lastName}`;

            let multiEmpNames = null;
            if (Array.isArray(d.employees)) {
                multiEmpNames = d.employees.map(id => empMap[id] ? `${empMap[id].personalDetails.firstName} ${empMap[id].personalDetails.lastName}` : 'Unknown');
            }

            return {
                _id: n.id,
                type: d.type || 'system',
                title: d.title,
                message: d.message,
                priority: d.priority || 'medium',
                read: isRead,
                createdAt: n.createdAt,
                organization: orgMap[d.organization]?.name || null,
                details: d.details,
                audienceType: d.audienceType || 'individual',
                department: d.department || null, // Keeping simple string if missing true mapping
                employee: singleEmpName,
                employees: multiEmpNames
            };
        });

        return NextResponse.json({
            success: true,
            notifications: formattedNotifications
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { notificationId } = await req.json();

        let whereCondition = {};
        if (isValidUUID(notificationId)) {
            whereCondition = { OR: [{ id: notificationId }, { mongoId: notificationId }] };
        } else {
            whereCondition = { mongoId: notificationId };
        }

        const notification = await prisma.notificationConfig.findFirst({
            where: whereCondition
        });
        
        if (!notification) {
            return NextResponse.json({ message: "Notification not found" }, { status: 404 });
        }

        const d = typeof notification.configData === 'object' && notification.configData !== null ? notification.configData : {};

        if (user.role !== 'admin' && notification.employeeId !== user.id && d.employee !== user.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const readBy = Array.isArray(d.readBy) ? [...d.readBy] : [];
        if (!readBy.includes(user.id)) {
            readBy.push(user.id);
            await prisma.notificationConfig.update({
                where: { id: notification.id },
                data: {
                    configData: {
                        ...d,
                        readBy
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    const user = await getUserFromRequest(req);
    
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, message, priority, type, audienceType, targetId, employees } = body;

        if (!title || !message) {
            return NextResponse.json({ message: "Title and message are required" }, { status: 400 });
        }

        const configData = {
            type: type || "system",
            title,
            message,
            priority: priority || 'medium',
            audienceType: audienceType || 'individual',
            organization: user.organizationId || null,
        };

        let employeeId = null;

        if (audienceType === 'team') {
            configData.department = targetId;
        } else if (audienceType === 'individual') {
            if (employees && Array.isArray(employees) && employees.length > 0) {
                configData.employees = employees;
            } else if (targetId) {
                employeeId = targetId;
                configData.employee = targetId;
            }
        }

        const newNotification = await prisma.notificationConfig.create({
            data: {
                employeeId,
                configData
            }
        });

        try {
            let targetEmails = [];
            let targetEmployeeIds = [];
            
            if (audienceType === 'individual') {
                const targets = [];
                if (employees && Array.isArray(employees) && employees.length > 0) {
                    targets.push(...employees);
                } else if (targetId) {
                    targets.push(targetId);
                }

                if (targets.length > 0) {
                    const validUUIDs = targets.filter(isValidUUID);
                    const emps = await prisma.employee.findMany({
                        where: {
                            OR: [
                                ...(validUUIDs.length > 0 ? [{ id: { in: validUUIDs } }] : []),
                                { mongoId: { in: targets } }
                            ]
                        },
                        select: { id: true, email: true }
                    });
                    targetEmails = emps.map(e => e.email).filter(Boolean);
                    targetEmployeeIds = emps.map(e => e.id).filter(Boolean);
                }
            } else if (audienceType === 'team' && targetId) {
                let deptId = targetId;
                const dept = await prisma.department.findFirst({
                    where: {
                        OR: [
                            ...(isValidUUID(targetId) ? [{ id: targetId }] : []),
                            { mongoId: targetId }
                        ]
                    }
                });
                if (dept) deptId = dept.id;

                const emps = await prisma.employee.findMany({
                    where: {
                        OR: [
                            { departmentId: deptId },
                            ...(dept?.mongoId ? [{ departmentId: dept.mongoId }] : [])
                        ],
                        status: 'Active'
                    },
                    select: { id: true, email: true }
                });
                targetEmails = emps.map(e => e.email).filter(Boolean);
                targetEmployeeIds = emps.map(e => e.id).filter(Boolean);
            } else if (audienceType === 'organization') {
                let orgId = user.organizationId;
                const org = await prisma.organization.findFirst({
                    where: {
                        OR: [
                            ...(isValidUUID(user.organizationId) ? [{ id: user.organizationId }] : []),
                            { mongoId: user.organizationId }
                        ]
                    }
                });
                if (org) orgId = org.id;

                const emps = await prisma.employee.findMany({
                    where: {
                        OR: [
                            { organizationId: orgId },
                            ...(org?.mongoId ? [{ organizationId: org.mongoId }] : [])
                        ],
                        status: 'Active'
                    },
                    select: { id: true, email: true }
                });
                targetEmails = emps.map(e => e.email).filter(Boolean);
                targetEmployeeIds = emps.map(e => e.id).filter(Boolean);
            }
            
            // Create in-app Notification records for all resolved target employees
            if (targetEmployeeIds.length > 0) {
                const notificationsData = targetEmployeeIds.map(empId => ({
                    employeeId: empId,
                    title: title,
                    message: message,
                    type: type || "system",
                    isRead: false
                }));
                await prisma.notification.createMany({
                    data: notificationsData
                }).catch(err => console.error("Failed to create in-app notifications:", err));
            }
            
            if (targetEmails.length > 0) {
                const origin = req.headers.get("origin") || "http://localhost:3000";
                const { subject, html } = getSystemNotificationTemplate({
                    title: configData.title,
                    message: configData.message,
                    priority: configData.priority,
                    dashboardUrl: origin
                });
                
                targetEmails.forEach(email => {
                    sendEmail({
                        to: email,
                        subject,
                        html
                    }).catch(err => console.error("Failed to send notification email to", email, err));
                });
            }
        } catch (emailError) {
            console.error("Error sending notification emails:", emailError);
        }

        return NextResponse.json({
            success: true,
            message: "Notification sent successfully",
            notification: { ...newNotification, ...configData, _id: newNotification.id }
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

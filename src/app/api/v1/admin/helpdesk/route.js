import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const fetchUsers = searchParams.get("fetchUsers");
        if (fetchUsers) {
            let userQuery = { isActive: true, role: { in: ["admin", "super_admin", "hr", "manager"] } };
            let empQuery = { status: "Active" };
            if (authUser.role !== "super_admin") {
                userQuery.organizationId = authUser.organizationId;
                empQuery.organizationId = authUser.organizationId;
            }
            
            const users = await prisma.user.findMany({ where: userQuery, select: { id: true, name: true, email: true, role: true } });
            const employees = await prisma.employee.findMany({ where: empQuery, select: { id: true, firstName: true, lastName: true, role: true } });

            const formattedEmployees = employees.map(emp => ({
                _id: emp.id,
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
                role: emp.role || 'employee'
            }));

            const allAssignees = [
                ...users.map(u => ({ _id: u.id, name: u.name, role: u.role })),
                ...formattedEmployees
            ];

            return NextResponse.json(allAssignees);
        }

        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");
        const pageParam = searchParams.get("page");
        const limitParam = searchParams.get("limit");

        let query = {};
        
        // Tenant and Role Isolation Scoping
        if (authUser.role === "employee" || authUser.role === "attendance_only") {
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
            if (!emp) {
                return NextResponse.json([], { status: 200 });
            }
            query.OR = [
                { employeeId: emp.id },
                { assignedTo: emp.id }
            ];
            if (emp.mongoId) {
                 query.OR.push({ employeeId: emp.mongoId });
                 query.OR.push({ assignedTo: emp.mongoId });
            }
        } else if (authUser.role !== "super_admin") {
            const myOrgEmployees = await prisma.employee.findMany({ where: { organizationId: authUser.organizationId }, select: { id: true, mongoId: true } });
            const myOrgEmployeeIds = myOrgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
            query.employeeId = { in: myOrgEmployeeIds };
        }

        if (employeeId) {
            let targetEmpId = employeeId;
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }, { employeeId: employeeId }] } });
            if (emp) targetEmpId = emp.id;

            if (query.employeeId && query.employeeId.in) {
                 if (query.employeeId.in.includes(targetEmpId) || query.employeeId.in.includes(emp?.mongoId)) {
                     query.employeeId = { in: [targetEmpId, emp?.mongoId].filter(Boolean) };
                 } else {
                     return NextResponse.json({ error: "Forbidden: Access is denied" }, { status: 403 });
                 }
            } else {
                 query.employeeId = { in: [targetEmpId, emp?.mongoId].filter(Boolean) };
            }
        }

        if (status) query.status = status;

        const page = parseInt(pageParam) || 1;
        const limit = parseInt(limitParam) || 10;
        const skip = (page - 1) * limit;

        const total = await prisma.helpdeskTicket.count({ where: query });
        
        const ticketsDocs = await prisma.helpdeskTicket.findMany({
            where: query,
            orderBy: { createdAt: 'desc' },
            ...(pageParam || limitParam ? { skip, take: limit } : {})
        });

        // Manually populate
        const empIds = [...new Set(ticketsDocs.map(t => t.employeeId).filter(Boolean))];
        const assignedIds = [...new Set(ticketsDocs.map(t => t.assignedTo).filter(Boolean))];

        const [employees, users] = await Promise.all([
            prisma.employee.findMany({ where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] }, select: { id: true, mongoId: true, firstName: true, lastName: true } }),
            prisma.user.findMany({ where: { OR: [{ id: { in: assignedIds } }, { mongoId: { in: assignedIds } }] }, select: { id: true, mongoId: true, name: true } })
        ]);

        const empMap = {};
        employees.forEach(e => {
            const data = { _id: e.id, personalDetails: { firstName: e.firstName, lastName: e.lastName } };
            empMap[e.id] = data;
            if (e.mongoId) empMap[e.mongoId] = data;
        });

        const userMap = {};
        users.forEach(u => {
            const data = { _id: u.id, name: u.name };
            userMap[u.id] = data;
            if (u.mongoId) userMap[u.mongoId] = data;
        });

        const tickets = ticketsDocs.map(t => ({
             _id: t.id,
             ...t,
             employee: empMap[t.employeeId] || null,
             assignedTo: userMap[t.assignedTo] || null,
             ...(typeof t.ticketData === 'object' && t.ticketData !== null ? t.ticketData : {})
        }));

        if (pageParam || limitParam) {
            return NextResponse.json({
                tickets,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            });
        }
        return NextResponse.json(tickets);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        if (!body.subject || !body.description || !body.employee) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let employeeObjectId = body.employee;

        let emp = await prisma.employee.findFirst({
             where: { OR: [{ id: employeeObjectId }, { mongoId: employeeObjectId }, { employeeId: employeeObjectId }] }
        });

        if (!emp) {
            return NextResponse.json({ error: "Employee record not found. Please ensure you have an active Employee profile." }, { status: 404 });
        }

        if (authUser.role === "employee" || authUser.role === "attendance_only") {
            const userEmp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
            if (!userEmp || userEmp.id !== emp.id) {
                return NextResponse.json({ error: "Forbidden: You can only create tickets for yourself" }, { status: 403 });
            }
        } else if (authUser.role !== "super_admin") {
            if (emp.organizationId !== authUser.organizationId) {
                return NextResponse.json({ error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
            }
        }

        const { _id, employee, assignedTo, status, subject, description, category, priority, ...ticketData } = body;

        const newTicket = await prisma.helpdeskTicket.create({
            data: {
                employeeId: emp.id,
                assignedTo: assignedTo || null,
                status: status || "Open",
                subject: subject,
                description: description,
                category: category,
                priority: priority,
                ticketData: ticketData
            }
        });

        return NextResponse.json({ ...newTicket, _id: newTicket.id }, { status: 201 });
    } catch (error) {
        console.error("Helpdesk Create Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

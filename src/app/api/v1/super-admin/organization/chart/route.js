import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

export async function GET(request) {
    try {
        
        const { searchParams } = new URL(request.url);
        let orgId = searchParams.get("orgId");

        let org;
        if (!orgId) {
            org = await prisma.organization.findFirst();
            if (!org) {
                return NextResponse.json({ error: "No organizations found" }, { status: 404 });
            }
            orgId = org.id;
        } else {
            org = await prisma.organization.findFirst({ where: { OR: [{ id: orgId }, { mongoId: orgId }] } });
            if (!org) {
                return NextResponse.json({ error: "Organization not found" }, { status: 404 });
            }
        }

        // Fetch all related data using flat Employee fields
        const [bus, depts, teams, employees] = await Promise.all([
            prisma.businessUnit.findMany({ where: { organizationId: orgId } }),
            prisma.department.findMany({ where: { organizationId: orgId } }),
            prisma.team.findMany({ where: {} }),
            prisma.employee.findMany({
                where: { organizationId: orgId, status: 'Active' },
                select: {
                    id: true,
                    employeeId: true,
                    firstName: true,
                    lastName: true,
                    designation: true,
                    departmentId: true,
                    businessUnitId: true,
                    teamId: true,
                }
            })
        ]);

        // Build the tree
        const buildTree = () => {
            const tree = {
                name: org.name,
                type: 'organization',
                id: org.id,
                children: []
            };

            bus.forEach(bu => {
                const buNode = {
                    name: bu.name,
                    type: 'businessUnit',
                    id: bu.id,
                    head: null,
                    children: []
                };

                const buDepts = depts.filter(d => d.businessUnitId?.toString() === bu.id.toString());
                buDepts.forEach(dept => {
                    const deptNode = {
                        name: dept.departmentName,
                        type: 'department',
                        id: dept.id,
                        children: []
                    };

                    const deptTeams = teams.filter(t => t.departmentId?.toString() === dept.id.toString());
                    deptTeams.forEach(team => {
                        const teamNode = {
                            name: team.name,
                            type: 'team',
                            id: team.id,
                            children: []
                        };

                        const teamEmps = employees.filter(e => e.teamId?.toString() === team.id.toString());
                        teamEmps.forEach(emp => {
                            teamNode.children.push({
                                name: `${emp.firstName} ${emp.lastName}`,
                                type: 'employee',
                                id: emp.id,
                                designation: emp.designation,
                                employeeId: emp.employeeId
                            });
                        });

                        deptNode.children.push(teamNode);
                    });

                    // Also add employees directly in department if not in a team
                    const directDeptEmps = employees.filter(e =>
                        e.departmentId?.toString() === dept.id.toString() &&
                        !e.teamId
                    );
                    directDeptEmps.forEach(emp => {
                        deptNode.children.push({
                            name: `${emp.firstName} ${emp.lastName}`,
                            type: 'employee',
                            id: emp.id,
                            designation: emp.designation,
                            employeeId: emp.employeeId
                        });
                    });

                    buNode.children.push(deptNode);
                });

                // Add employees directly in BU if not in a dept
                const directBuEmps = employees.filter(e =>
                    e.businessUnitId?.toString() === bu.id.toString() &&
                    !e.departmentId
                );
                directBuEmps.forEach(emp => {
                    buNode.children.push({
                        name: `${emp.firstName} ${emp.lastName}`,
                        type: 'employee',
                        id: emp.id,
                        designation: emp.designation,
                        employeeId: emp.employeeId
                    });
                });

                tree.children.push(buNode);
            });

            // Add departments directly in Org if not in a BU
            const directDepts = depts.filter(d => !d.businessUnitId);
            directDepts.forEach(dept => {
                const deptNode = {
                    name: dept.departmentName,
                    type: 'Department',
                    id: dept.id,
                    children: []
                };
                tree.children.push(deptNode);
            });

            return tree;
        };

        return NextResponse.json({ data: [buildTree()] });

    } catch (error) {
        console.error("Org Chart API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

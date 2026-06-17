import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') || '').trim();
        const mode = searchParams.get('mode') || 'managers'; // 'managers' or 'search'

        // Fetch all active employees (excluding self)
        const employees = await prisma.employee.findMany({
            where: {
                status: 'Active',
                NOT: { id: authUser.id }
            }
        });

        const mapped = employees.map(emp => {
            const modelData = emp.modelData || {};
            return {
                _id: emp.id,
                id: emp.id,
                mongoId: emp.mongoId,
                employeeId: emp.employeeId,
                personalDetails: {
                    firstName: modelData.personalDetails?.firstName || "",
                    lastName: modelData.personalDetails?.lastName || "",
                    thumbnail: modelData.personalDetails?.thumbnail || ""
                },
                jobDetails: {
                    designation: modelData.jobDetails?.designation || "",
                    department: modelData.jobDetails?.department || ""
                }
            };
        });

        // MODE 1: "managers"
        if (mode === 'managers' || (!search && mode !== 'search')) {
            const leadershipWords = ['manager', 'hr', 'lead', 'admin', 'director', 'head', 'supervisor', 'cto', 'ceo', 'coo', 'vp'];
            const managers = mapped.filter(emp => {
                const des = (emp.jobDetails.designation || '').toLowerCase();
                return leadershipWords.some(word => des.includes(word));
            });

            return NextResponse.json({
                success: true,
                data: managers
            });
        }

        // MODE 2: "search"
        if (search && search.length >= 2) {
            const sLower = search.toLowerCase();
            const searchParts = sLower.split(/\s+/);

            const filtered = mapped.filter(emp => {
                const eId = (emp.employeeId || '').toLowerCase();
                const fn = (emp.personalDetails.firstName || '').toLowerCase();
                const ln = (emp.personalDetails.lastName || '').toLowerCase();
                const des = (emp.jobDetails.designation || '').toLowerCase();
                const dep = (emp.jobDetails.department || '').toLowerCase();

                // Check matches
                const matchesId = eId.includes(sLower);
                const matchesDesignation = des.includes(sLower);
                const matchesDepartment = dep.includes(sLower);
                
                // Matches firstName and lastName parts
                const matchesName = searchParts.every(part => fn.includes(part) || ln.includes(part));

                return matchesId || matchesDesignation || matchesDepartment || matchesName;
            });

            return NextResponse.json({
                success: true,
                data: filtered
            });
        }

        return NextResponse.json({ success: true, data: [] });

    } catch (error) {
        console.error('Error searching approvers:', error);
        return NextResponse.json({ success: false, error: 'Failed to search employees' }, { status: 500 });
    }
}

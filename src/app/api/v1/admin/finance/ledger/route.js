import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const source = searchParams.get('source');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        // Fetch journal entries under organization or null
        const allEntries = await prisma.journalEntry.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        let entries = allEntries.map(je => {
            const mData = je.modelData && typeof je.modelData === 'object' ? je.modelData : {};
            return {
                _id: je.id,
                id: je.id,
                mongoId: je.mongoId,
                organizationId: je.organizationId,
                status: je.status,
                ...mData,
                createdAt: je.createdAt,
                updatedAt: je.updatedAt
            };
        });

        // Filter by source
        if (source) {
            entries = entries.filter(je => je.source === source);
        }

        // Filter by date range
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            entries = entries.filter(je => {
                const jeDate = je.date ? new Date(je.date) : new Date(je.createdAt);
                if (start && jeDate < start) return false;
                if (end && jeDate > end) return false;
                return true;
            });
        }

        // Sort by date or createdAt descending in-memory
        entries.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(a.createdAt);
            const dateB = b.date ? new Date(b.date) : new Date(b.createdAt);
            return dateB - dateA;
        });

        return NextResponse.json({ entries });
    } catch (error) {
        console.error("GET Ledger error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;

        // Manual journal entry creation
        const entry = await prisma.journalEntry.create({
            data: {
                organizationId: org ? org.id : authUser.organizationId,
                status: body.status || 'Active',
                modelData: body
            }
        });

        const formatted = {
            ...entry,
            _id: entry.id,
            ...(entry.modelData || {})
        };

        return NextResponse.json({ entry: formatted, message: "Journal entry posted successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST Ledger error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request) {
    try {
        const user = await getAuthUser(); // Ensure user is authenticated
        
        let where = {};
        if (user.role !== "super_admin" && user.organizationId) {
            where.organizationId = user.organizationId;
        }

        const docs = await prisma.handbookDocument.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
        });

        const formattedDocs = docs.map(d => {
            const md = typeof d.modelData === 'object' && d.modelData !== null ? d.modelData : {};
            return {
                _id: d.id,
                ...d,
                ...md
            };
        });

        return NextResponse.json(formattedDocs);
    } catch (error) {
        console.error("GET HANDBOOK DOCUMENTS ERROR:", error);
        const isAuthError = error.message.startsWith("Unauthorized");
        return NextResponse.json({ error: error.message }, { status: isAuthError ? 401 : 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getAuthUser();
        // Restrict uploading to admin/hr/super_admin roles
        authorize(user, ["admin", "hr", "super_admin"]);

        const body = await request.json();

        if (!body.title || !body.fileUrl) {
            return NextResponse.json({ error: "Title and File URL are required" }, { status: 400 });
        }

        const orgId = user.role !== 'super_admin' ? user.organizationId : body.organizationId;
        const { title, fileUrl, category, ...rest } = body;

        const newDoc = await prisma.handbookDocument.create({
            data: {
                organizationId: orgId,
                status: "Active",
                modelData: {
                    title,
                    fileUrl,
                    category: category || "Policies",
                    uploadedBy: user.id || user._id,
                    ...rest
                }
            }
        });

        const responseData = {
            _id: newDoc.id,
            ...newDoc,
            ...(typeof newDoc.modelData === 'object' && newDoc.modelData !== null ? newDoc.modelData : {})
        };

        return NextResponse.json(responseData, { status: 201 });
    } catch (error) {
        console.error("Error uploading document:", error);
        const isAuthError = error.message.startsWith("Unauthorized") || error.message.startsWith("Forbidden");
        const status = isAuthError ? (error.message.startsWith("Unauthorized") ? 401 : 403) : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}

export async function DELETE(request) {
    try {
        const user = await getAuthUser();
        // Restrict deleting to admin/hr/super_admin roles
        authorize(user, ["admin", "hr", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        let whereClause = {
            OR: [
                ...(isValidUUID(id) ? [{ id: id }] : []),
                { mongoId: id }
            ]
        };
        if (user.role !== "super_admin" && user.organizationId) {
            whereClause.organizationId = user.organizationId;
        }

        const existingDoc = await prisma.handbookDocument.findFirst({
            where: whereClause
        });

        if (!existingDoc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        await prisma.handbookDocument.delete({
            where: { id: existingDoc.id }
        });

        return NextResponse.json({ message: "Document deleted" });
    } catch (error) {
        console.error("Error deleting document:", error);
        const isAuthError = error.message.startsWith("Unauthorized") || error.message.startsWith("Forbidden");
        const status = isAuthError ? (error.message.startsWith("Unauthorized") ? 401 : 403) : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}


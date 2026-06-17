import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser } from "@/lib/auth-util";

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        let organizationId = searchParams.get("organizationId");

        // SaaS Protection: Use user's org if they are an admin/employee
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            organizationId = authUser.organizationId;
        }

        const query = {};
        if (organizationId) {
            query.organizationId = organizationId;
        }

        const locations = await prisma.officeLocation.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        });

        const mappedLocations = locations.map(loc => {
            const addressObj = typeof loc.address === 'object' && loc.address !== null ? loc.address : {};
            return {
                ...loc,
                _id: loc.id,
                name: loc.locationName,
                isActive: loc.status === 'Active',
                coordinates: addressObj.coordinates || { latitude: "", longitude: "" },
                radius: addressObj.radius || 100,
                address: addressObj
            };
        });

        return NextResponse.json({
            success: true,
            locations: mappedLocations,
        });
    } catch (error) {
        console.error("Error fetching office locations:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();

        // Enforce SaaS boundaries: override payload orgId with user's orgId
        let organizationId = body.organizationId;
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            organizationId = authUser.organizationId;
        }

        // Failsafe validation
        if (!organizationId) {
            return NextResponse.json({ success: false, error: "Organization ID is required" }, { status: 400 });
        }

        const dbPayload = {
            organizationId,
            locationName: body.name || 'Unknown',
            status: body.isActive !== false ? 'Active' : 'Inactive',
            address: {
                ...(body.address || {}),
                coordinates: body.coordinates || { latitude: "", longitude: "" },
                radius: body.radius || 100
            }
        };

        const location = await prisma.officeLocation.create({
            data: dbPayload
        });

        const addressObj = location.address || {};
        const mappedLocation = {
            ...location,
            _id: location.id,
            name: location.locationName,
            isActive: location.status === 'Active',
            coordinates: addressObj.coordinates || { latitude: "", longitude: "" },
            radius: addressObj.radius || 100,
            address: addressObj
        };

        return NextResponse.json({
            success: true,
            location: mappedLocation,
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating office location:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Location ID is required" },
                { status: 400 }
            );
        }

        // Fetch existing record first to merge address JSON
        const existing = await prisma.officeLocation.findFirst({
            where: isValidUUID(id) ? { OR: [{ id: id }, { mongoId: id }] } : { mongoId: id }
        });
        if (!existing) {
            return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
        }

        const dbPayload = {};
        if (updateData.name !== undefined) dbPayload.locationName = updateData.name;
        if (updateData.isActive !== undefined) dbPayload.status = updateData.isActive ? 'Active' : 'Inactive';
        
        const existingAddress = typeof existing.address === 'object' && existing.address !== null ? existing.address : {};
        if (updateData.address !== undefined || updateData.coordinates !== undefined || updateData.radius !== undefined) {
            dbPayload.address = {
                ...existingAddress,
                ...(updateData.address || {}),
                coordinates: updateData.coordinates !== undefined ? updateData.coordinates : existingAddress.coordinates,
                radius: updateData.radius !== undefined ? updateData.radius : existingAddress.radius
            };
        }

        const location = await prisma.officeLocation.update({
            where: { id: existing.id },
            data: dbPayload,
        });

        const addressObj = location.address || {};
        const mappedLocation = {
            ...location,
            _id: location.id,
            name: location.locationName,
            isActive: location.status === 'Active',
            coordinates: addressObj.coordinates || { latitude: "", longitude: "" },
            radius: addressObj.radius || 100,
            address: addressObj
        };

        return NextResponse.json({
            success: true,
            location: mappedLocation
        });

    } catch (error) {
        console.error("Error updating office location:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Location ID is required" },
                { status: 400 }
            );
        }

        const existing = await prisma.officeLocation.findFirst({
            where: isValidUUID(id) ? { OR: [{ id: id }, { mongoId: id }] } : { mongoId: id }
        });
        if (!existing) {
            return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
        }

        await prisma.officeLocation.delete({
            where: { id: existing.id }
        });

        return NextResponse.json({
            success: true,
            message: "Location deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting office location:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

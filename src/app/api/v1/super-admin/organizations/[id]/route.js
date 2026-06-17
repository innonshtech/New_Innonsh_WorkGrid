// src/app/api/organizations/[id]/route.js
import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

import cloudinary from "@/lib/cloudinary";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    
    const { id } = await params;

    // SaaS PROTECTION: Admin can only view their own org
    if (authUser.role === "admin" && authUser.organizationId !== id) {
      return NextResponse.json({ error: "Forbidden: Access denied to this organization" }, { status: 403 });
    }

    const organization = await prisma.organization.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("GET ONE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    
    const { id } = await params;

    // SaaS PROTECTION: Admin can only update their own org
    if (authUser.role === "admin" && authUser.organizationId !== id) {
      return NextResponse.json({ error: "Forbidden: You can only update your own organization" }, { status: 403 });
    }

    const formData = await request.formData();
    const updates = {};

    // Parse text fields
    for (let [key, value] of formData.entries()) {
      if (key !== "logo") updates[key] = value;
    }

    const file = formData.get("logo");

    // If new logo uploaded
    if (file && file.size > 0) {
      const org = await prisma.organization.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

      // Delete old logo from Cloudinary
      if (org?.logo) {
        const publicId = org.logo.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`organizations/${publicId}`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const upload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "organizations" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

      updates.logo = upload.secure_url;
    }

    const orgToUpdate = await prisma.organization.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!orgToUpdate) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const updated = await prisma.organization.update({
      where: { id: orgToUpdate.id },
      data: updates
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    // Only super_admin can delete organizations in this SaaS model
    authorize(authUser, ["super_admin"]);

    const { id } = await params;

    const org = await prisma.organization.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // delete logo from Cloudinary
    if (org.logo) {
      const publicId = org.logo.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`organizations/${publicId}`);
    }

    await prisma.organization.delete({ where: { id: org.id } });

    return NextResponse.json({ message: "Organization deleted" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

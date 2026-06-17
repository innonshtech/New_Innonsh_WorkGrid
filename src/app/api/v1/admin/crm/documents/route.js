import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET: Fetch all documents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 1000;

    const documents = await prisma.document.findMany({
      select: {
        id: true, // Assuming Prisma 'id' maps to Mongoose '_id'
        name: true,
        description: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    // Map 'id' to '_id' for consistency with original Mongoose response shape
    const formattedDocuments = documents.map(doc => ({
      _id: doc.id,
      name: doc.name,
      description: doc.description,
    }));

    return NextResponse.json(
      { data: formattedDocuments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST: Create a new document
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, documentCategory } = body;

    // Basic validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Document name is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existingDocument = await prisma.document.findFirst({
      where: { name: name.trim() },
    });
    if (existingDocument) {
      return NextResponse.json(
        { error: "A document with this name already exists" },
        { status: 409 }
      );
    }

    // Create new document
    const document = await prisma.document.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        documentCategory: documentCategory, // Ensure documentCategory matches your Prisma schema relation/field type
      },
    });

    console.log(document);

    return NextResponse.json(
      {
        _id: document.id, // Assuming Prisma 'id' maps to Mongoose '_id'
        name: document.name,
        description: document.description,
        documentCategory: document.documentCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document:", error);
    // Mongoose ValidationError check; will likely not be hit by Prisma errors directly
    // Prisma errors would typically be caught by the generic 500 block unless specifically handled
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: Object.values(error.errors)[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
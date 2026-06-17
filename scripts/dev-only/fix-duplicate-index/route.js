import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Organization from "@/lib/db/models/crm/organization/Organization";

export async function GET() {
  try {
    await dbConnect();
    console.log("Attempting to drop email_1 index on organizations...");
    
    // Check if index exists first (optional, but good for debug)
    const indexes = await Organization.collection.indexes();
    console.log("Current indexes:", indexes);
    
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    
    if (emailIndex) {
        await Organization.collection.dropIndex("email_1");
        return NextResponse.json({ message: "Successfully dropped email_1 index", indexes_before: indexes });
    } else {
        return NextResponse.json({ message: "Index email_1 not found, might already be dropped", indexes });
    }
  } catch (error) {
    console.error("Error dropping index:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

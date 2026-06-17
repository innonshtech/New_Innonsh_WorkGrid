const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("❌ MONGODB_URI is required to migrate data.");
    process.exit(1);
}

async function migrateData() {
    console.log("🚀 Starting Full-Fidelity CRM Data Migration...");
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // 1. Migrate EmployeeType
    console.log("\n⏳ Migrating EmployeeType...");
    const mongoTypes = await db.collection('employeetypes').find({}).toArray();
    let typeCount = 0;
    for (const doc of mongoTypes) {
        const mongoIdStr = doc._id.toString();
        const dataPayload = {
            mongoId: mongoIdStr,
            organizationId: doc.organizationId ? doc.organizationId.toString() : null,
            departmentId: doc.departmentId ? doc.departmentId.toString() : null,
            type: doc.employeeType || 'Unknown',
            employeeType: doc.employeeType || null,
            status: doc.status || "Active",
            createdBy: doc.createdBy ? doc.createdBy.toString() : null,
            updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        };

        await prisma.employeeType.upsert({
            where: { mongoId: mongoIdStr },
            update: dataPayload,
            create: dataPayload
        });
        typeCount++;
    }
    console.log(`✅ Migrated ${typeCount} EmployeeType records`);

    // 2. Migrate EmployeeCategory
    console.log("\n⏳ Migrating EmployeeCategory...");
    const mongoCategories = await db.collection('employeecategories').find({}).toArray();
    let catCount = 0;
    for (const doc of mongoCategories) {
        const mongoIdStr = doc._id.toString();
        const dataPayload = {
            mongoId: mongoIdStr,
            organizationId: doc.organizationId ? doc.organizationId.toString() : null,
            departmentId: doc.departmentId ? doc.departmentId.toString() : null,
            employeeTypeId: doc.employeeTypeId ? doc.employeeTypeId.toString() : null,
            categoryName: doc.employeeCategory || 'Unknown',
            employeeCategory: doc.employeeCategory || null,
            supportedDocuments: Array.isArray(doc.supportedDocuments) ? doc.supportedDocuments.map(id => id.toString()) : [],
            status: doc.status || "Active",
            createdBy: doc.createdBy ? doc.createdBy.toString() : null,
            updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        };

        await prisma.employeeCategory.upsert({
            where: { mongoId: mongoIdStr },
            update: dataPayload,
            create: dataPayload
        });
        catCount++;
    }
    console.log(`✅ Migrated ${catCount} EmployeeCategory records`);

    // 3. Migrate Team
    console.log("\n⏳ Migrating Team...");
    const mongoTeams = await db.collection('teams').find({}).toArray();
    let teamCount = 0;
    for (const doc of mongoTeams) {
        const mongoIdStr = doc._id.toString();
        const dataPayload = {
            mongoId: mongoIdStr,
            organizationId: doc.organizationId ? doc.organizationId.toString() : null,
            departmentId: doc.departmentId ? doc.departmentId.toString() : null,
            teamName: doc.name || 'Unknown',
            name: doc.name || null,
            teamLeadId: doc.teamLead ? doc.teamLead.toString() : null,
            description: doc.description || null,
            status: doc.status || "Active",
            createdBy: doc.createdBy ? doc.createdBy.toString() : null,
            updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        };

        await prisma.team.upsert({
            where: { mongoId: mongoIdStr },
            update: dataPayload,
            create: dataPayload
        });
        teamCount++;
    }
    console.log(`✅ Migrated ${teamCount} Team records`);

    // 4. Migrate EmployeeSubCategory
    console.log("\n⏳ Migrating EmployeeSubCategory...");
    const mongoSubCategories = await db.collection('employeesubcategories').find({}).toArray();
    let subCatCount = 0;
    for (const doc of mongoSubCategories) {
        const mongoIdStr = doc._id.toString();
        const dataPayload = {
            mongoId: mongoIdStr,
            organizationId: doc.organizationId ? doc.organizationId.toString() : null,
            employeeId: doc.employeeId ? doc.employeeId.toString() : null,
            employeeSubCategory: doc.employeeSubCategory || null,
            employeeCategoryId: doc.employeeCategoryId ? doc.employeeCategoryId.toString() : null,
            departmentId: doc.departmentId ? doc.departmentId.toString() : null,
            employeeTypeId: doc.employeeTypeId ? doc.employeeTypeId.toString() : null,
            status: doc.status || "Active",
            createdBy: doc.createdBy ? doc.createdBy.toString() : null,
            updatedBy: doc.updatedBy ? doc.updatedBy.toString() : null,
            modelData: doc,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        };

        await prisma.employeeSubCategory.upsert({
            where: { mongoId: mongoIdStr },
            update: dataPayload,
            create: dataPayload
        });
        subCatCount++;
    }
    console.log(`✅ Migrated ${subCatCount} EmployeeSubCategory records`);

    // 5. Migrate Document
    console.log("\n⏳ Migrating Document...");
    const mongoDocs = await db.collection('documents').find({}).toArray();
    let docCount = 0;
    for (const doc of mongoDocs) {
        const mongoIdStr = doc._id.toString();
        const dataPayload = {
            mongoId: mongoIdStr,
            organizationId: doc.organizationId ? doc.organizationId.toString() : null,
            employeeId: doc.employeeId ? doc.employeeId.toString() : null,
            status: doc.status || "Active",
            name: doc.name || null,
            description: doc.description || null,
            documentCategory: doc.documentCategory || null,
            modelData: doc,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        };

        await prisma.document.upsert({
            where: { mongoId: mongoIdStr },
            update: dataPayload,
            create: dataPayload
        });
        docCount++;
    }
    console.log(`✅ Migrated ${docCount} Document records`);

    console.log("\n🎉 Full-Fidelity CRM Data Migration Complete!");
    await mongoose.disconnect();
    await prisma.$disconnect();
}

migrateData().catch(e => {
    console.error("Migration fatal error:", e);
    process.exit(1);
});

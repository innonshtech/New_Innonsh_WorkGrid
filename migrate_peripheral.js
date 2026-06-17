const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

// Initialize Prisma
const prisma = new PrismaClient();

// MongoDB Connection string (Make sure to provide the full URI or uncomment it in .env.local if needed)
// If it's commented out in .env.local, we'll try reading MONGODB_URI directly or fall back to an error.
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("❌ MONGODB_URI is required to migrate data. Please uncomment it in .env.local");
    process.exit(1);
}

// 1. Get a list of the models we just added to Prisma dynamically
const fs = require('fs');
const path = require('path');
const prismaSchema = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf-8');
const autoGenBlock = prismaSchema.split('// --- AUTO-GENERATED PERIPHERAL MODELS ---')[1];

let peripheralModels = [];
if (autoGenBlock) {
    const matches = autoGenBlock.match(/model\s+([A-Za-z0-9_]+)\s+{/g);
    if (matches) {
        peripheralModels = matches.map(m => m.replace('model ', '').replace(' {', '').trim());
    }
}

async function migrateData() {
    console.log("🚀 Starting Peripheral Data Migration...");
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    for (const modelName of peripheralModels) {
        console.log(`\n⏳ Migrating Collection: ${modelName}...`);
        
        try {
            // Check if collection exists in Mongoose
            const collectionName = mongoose.pluralize()(modelName);
            const db = mongoose.connection.db;
            const collections = await db.listCollections({ name: collectionName }).toArray();
            
            if (collections.length === 0) {
                console.log(`   ⏭️ Collection '${collectionName}' does not exist in MongoDB. Skipping.`);
                continue;
            }

            // Fetch records from Mongo
            const records = await db.collection(collectionName).find({}).toArray();
            if (records.length === 0) {
                console.log(`   ⏭️ 0 records found. Skipping.`);
                continue;
            }
            
            console.log(`   📥 Found ${records.length} records. Moving to Supabase...`);

            const prismaModelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            
            // Validate Prisma Model exists
            if (!prisma[prismaModelName]) {
                 console.log(`   ⚠️ Prisma model '${prismaModelName}' not found on Prisma Client. Skipping.`);
                 continue;
            }

            let successCount = 0;
            for (const doc of records) {
                const mongoIdStr = doc._id.toString();

                // Build the record data
                // We map all fields into the `modelData` JSON field except standard relations
                const { _id, organizationId, employeeId, status, createdAt, updatedAt, ...restData } = doc;

                const dataPayload = {
                    mongoId: mongoIdStr,
                    organizationId: organizationId ? organizationId.toString() : null,
                    employeeId: employeeId ? employeeId.toString() : null,
                    status: status || "Active",
                    modelData: restData,
                    createdAt: createdAt ? new Date(createdAt) : new Date(),
                    updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
                };

                // Upsert to Supabase
                await prisma[prismaModelName].upsert({
                    where: { mongoId: mongoIdStr },
                    update: dataPayload,
                    create: dataPayload
                });
                successCount++;
            }
            
            console.log(`   ✅ Successfully migrated ${successCount} records for ${modelName}`);

        } catch (err) {
            console.error(`   ❌ Failed to migrate ${modelName}:`, err.message);
        }
    }

    console.log("\n🎉 Peripheral Data Migration Complete!");
    await mongoose.disconnect();
    await prisma.$disconnect();
}

migrateData().catch(e => {
    console.error("Migration fatal error:", e);
    process.exit(1);
});

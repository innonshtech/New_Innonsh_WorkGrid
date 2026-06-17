const { MongoClient } = require('mongodb');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Temporary MongoDB URI for migration
const MONGODB_URI = "mongodb+srv://xpertance:XPERTANCE@cluster0.dnv2io.mongodb.net/hr_payroll?retryWrites=true&w=majority";

const prisma = new PrismaClient();

async function migrateData() {
    console.log("Connecting to MongoDB...");
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB.");
    
    const db = client.db('hr_payroll');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections.`);

    // Mapping collections to Prisma Models
    const collectionMap = {
        'users': 'user',
        'organizations': 'organization',
        'employees': 'employee',
        'roles': 'role',
        'tasks': 'task',
        'assets': 'asset',
        'leaves': 'leave',
        'attendances': 'attendance',
        'payslips': 'payslip',
        'payrollruns': 'payrollRun',
        'holidaylists': 'holidayList',
        'holidays': 'holiday',
        'helpdesktickets': 'helpdeskTicket',
        'notificationconfigs': 'notificationConfig',
        'staffingclients': 'staffingClient'
        // Add more mappings as needed
    };

    for (const coll of collections) {
        const collName = coll.name;
        if (collectionMap[collName]) {
            const prismaModel = collectionMap[collName];
            console.log(`Migrating collection: ${collName} -> Prisma model: ${prismaModel}`);
            
            const docs = await db.collection(collName).find({}).toArray();
            console.log(`  Found ${docs.length} documents.`);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const doc of docs) {
                try {
                    const mongoIdStr = doc._id.toString();
                    
                    // Check if exists
                    const existing = await prisma[prismaModel].findUnique({
                        where: { mongoId: mongoIdStr }
                    });
                    
                    if (existing) {
                        continue; // skip
                    }
                    
                    // Prepare data based on model
                    let data = { mongoId: mongoIdStr };
                    
                    if (prismaModel === 'user') {
                        data.name = doc.name || 'Unknown';
                        data.email = doc.email || 'unknown@example.com';
                        data.password = doc.password || '';
                        data.role = doc.role || 'admin';
                        data.organizationId = doc.organizationId?.toString();
                    } else if (prismaModel === 'organization') {
                        data.orgId = doc.orgId || `ORG-${mongoIdStr.substring(0, 5)}`;
                        data.name = doc.name || 'Unknown';
                        data.email = doc.email || 'unknown@example.com';
                        data.createdById = doc.createdById?.toString() || '';
                    } else if (prismaModel === 'employee') {
                        data.employeeId = doc.employeeId || `EMP-${mongoIdStr.substring(0, 5)}`;
                        data.firstName = doc.personalDetails?.firstName || 'Unknown';
                        data.lastName = doc.personalDetails?.lastName || 'Unknown';
                        data.email = doc.personalDetails?.email || 'unknown@example.com';
                        data.phone = doc.personalDetails?.phone || '';
                        data.dateOfJoining = doc.personalDetails?.dateOfJoining ? new Date(doc.personalDetails.dateOfJoining) : new Date();
                        data.department = doc.jobDetails?.department || 'Unknown';
                        data.designation = doc.jobDetails?.designation || 'Unknown';
                        data.organizationId = doc.jobDetails?.organizationId?.toString();
                        // Pack everything else into modelData? We don't have modelData for employee, we have specific JSON fields
                        data.address = doc.personalDetails?.address || null;
                        data.payslipStructure = doc.payslipStructure || null;
                    } else if (prismaModel === 'role') {
                        data.roleName = doc.roleName || doc.name || 'Unknown';
                        data.organizationId = doc.organizationId?.toString();
                        data.roleData = doc;
                    } else {
                        // Generic JSON packing strategy for models that support it
                        const modelDataMap = {
                            'task': 'taskData',
                            'asset': 'assetData',
                            'staffingClient': 'modelData',
                            'notificationConfig': 'configData',
                            'holiday': 'holidayData',
                            'holidayList': 'holidayListData'
                        };
                        
                        if (modelDataMap[prismaModel]) {
                            const jsonField = modelDataMap[prismaModel];
                            
                            // For StaffingClient, Prisma uses model "Staffing"
                            let actualPrismaModel = prismaModel;
                            if (prismaModel === 'staffingClient') {
                                actualPrismaModel = 'staffing';
                                data.modelData = doc;
                                data.modelData.type = 'Client';
                            } else {
                                data[jsonField] = doc;
                            }
                            
                            if (doc.name) data.name = doc.name;
                            if (doc.title) data.title = doc.title;
                            if (doc.organizationId) data.organizationId = doc.organizationId.toString();
                            if (doc.employeeId) data.employeeId = doc.employeeId.toString();
                            
                            try {
                                await prisma[actualPrismaModel].create({ data });
                                successCount++;
                            } catch (createErr) {
                                console.log("Create Error: ", createErr.message);
                                errorCount++;
                            }
                        } else {
                            console.log(`  Skipping detailed mapping for ${prismaModel} in this generic script`);
                            continue;
                        }
                        continue; // already handled create
                    }
                    
                    try {
                        if (prismaModel !== 'staffingClient') {
                            await prisma[prismaModel].create({ data });
                            successCount++;
                        }
                    } catch (createErr) {
                         console.log("Create Error: ", createErr.message);
                         errorCount++;
                    }
                    
                } catch (err) {
                    errorCount++;
                }
            }
            console.log(`  Migrated ${successCount} successfully, ${errorCount} errors.`);
        } else {
            console.log(`Skipping unmapped collection: ${collName}`);
        }
    }
    
    console.log("Migration complete.");
    await client.close();
    await prisma.$disconnect();
}

migrateData().catch(console.error);

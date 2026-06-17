const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function backfill() {
    console.log("Starting backfill for Handbook Documents...");

    // 1. Fetch all Organizations to map mongoId -> UUID
    const orgs = await prisma.organization.findMany({
        select: { id: true, mongoId: true }
    });
    const orgMap = {};
    orgs.forEach(o => {
        if (o.mongoId) orgMap[o.mongoId] = o.id;
    });

    // 2. Fetch all HandbookDocuments
    const docs = await prisma.handbookDocument.findMany();
    let updatedCount = 0;

    for (const doc of docs) {
        let updated = false;
        let newOrgId = doc.organizationId;

        if (doc.organizationId && !isValidUUID(doc.organizationId)) {
            const uuid = orgMap[doc.organizationId];
            if (uuid) {
                newOrgId = uuid;
                updated = true;
            } else {
                console.warn(`Could not find UUID org for HandbookDocument organizationId: ${doc.organizationId}`);
            }
        } else if (!doc.organizationId) {
            // Default to first org if null
            const defaultOrg = orgs[0];
            if (defaultOrg) {
                newOrgId = defaultOrg.id;
                updated = true;
            }
        }

        if (updated) {
            await prisma.handbookDocument.update({
                where: { id: doc.id },
                data: { organizationId: newOrgId }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} HandbookDocument records.`);
}

backfill()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

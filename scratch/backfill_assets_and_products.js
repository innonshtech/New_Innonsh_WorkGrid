const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function backfill() {
    console.log("Starting backfill for Assets and Product Catalog...");

    // 1. Fetch all Organizations to map mongoId -> UUID
    const orgs = await prisma.organization.findMany({
        select: { id: true, mongoId: true }
    });
    const orgMap = {};
    orgs.forEach(o => {
        if (o.mongoId) orgMap[o.mongoId] = o.id;
    });

    // 2. Fetch all Employees to map mongoId -> UUID
    const emps = await prisma.employee.findMany({
        select: { id: true, mongoId: true }
    });
    const empMap = {};
    emps.forEach(e => {
        if (e.mongoId) empMap[e.mongoId] = e.id;
    });

    // 3. Fetch all ProductCatalogs to map mongoId -> UUID
    const catalogs = await prisma.productCatalog.findMany();
    const catalogMap = {};
    catalogs.forEach(c => {
        if (c.mongoId) catalogMap[c.mongoId] = c.id;
    });

    console.log(`Loaded map sizes: Orgs=${Object.keys(orgMap).length}, Emps=${Object.keys(empMap).length}, Catalogs=${Object.keys(catalogMap).length}`);

    // Backfill ProductCatalog organizationId and employeeId
    let productUpdated = 0;
    for (const prod of catalogs) {
        let updated = false;
        let newOrgId = prod.organizationId;
        let newEmpId = prod.employeeId;

        if (prod.organizationId && !isValidUUID(prod.organizationId)) {
            const uuid = orgMap[prod.organizationId];
            if (uuid) {
                newOrgId = uuid;
                updated = true;
            } else {
                console.warn(`Could not find UUID org for ProductCatalog organizationId: ${prod.organizationId}`);
            }
        }

        if (prod.employeeId && !isValidUUID(prod.employeeId)) {
            const uuid = empMap[prod.employeeId];
            if (uuid) {
                newEmpId = uuid;
                updated = true;
            } else {
                console.warn(`Could not find UUID employee for ProductCatalog employeeId: ${prod.employeeId}`);
            }
        }

        if (updated) {
            await prisma.productCatalog.update({
                where: { id: prod.id },
                data: {
                    organizationId: newOrgId,
                    employeeId: newEmpId
                }
            });
            productUpdated++;
        }
    }
    console.log(`Updated ${productUpdated} ProductCatalog records.`);

    // Backfill Asset organizationId, employeeId, and assetData.productCatalogId
    const assets = await prisma.asset.findMany();
    let assetUpdated = 0;
    for (const asset of assets) {
        let updated = false;
        let newOrgId = asset.organizationId;
        let newEmpId = asset.employeeId;
        let newAssetData = typeof asset.assetData === 'object' && asset.assetData !== null ? { ...asset.assetData } : {};

        if (asset.organizationId && !isValidUUID(asset.organizationId)) {
            const uuid = orgMap[asset.organizationId];
            if (uuid) {
                newOrgId = uuid;
                updated = true;
            } else {
                console.warn(`Could not find UUID org for Asset organizationId: ${asset.organizationId}`);
            }
        }

        if (asset.employeeId && !isValidUUID(asset.employeeId)) {
            const uuid = empMap[asset.employeeId];
            if (uuid) {
                newEmpId = uuid;
                updated = true;
            } else {
                console.warn(`Could not find UUID employee for Asset employeeId: ${asset.employeeId}`);
            }
        }

        if (newAssetData.productCatalogId && !isValidUUID(newAssetData.productCatalogId)) {
            const uuid = catalogMap[newAssetData.productCatalogId];
            if (uuid) {
                newAssetData.productCatalogId = uuid;
                updated = true;
            } else {
                console.warn(`Could not find UUID catalog for Asset productCatalogId: ${newAssetData.productCatalogId}`);
            }
        }

        if (updated) {
            await prisma.asset.update({
                where: { id: asset.id },
                data: {
                    organizationId: newOrgId,
                    employeeId: newEmpId,
                    assetData: newAssetData
                }
            });
            assetUpdated++;
        }
    }
    console.log(`Updated ${assetUpdated} Asset records.`);
}

backfill()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

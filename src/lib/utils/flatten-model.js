import prisma from '@/lib/db/prisma';

/**
 * Flattens the `modelData` JSON field into the top-level object.
 * This is needed because many auto-generated models store all original
 * MongoDB fields inside a single `modelData` JSON column.
 * 
 * Example:
 *   { id: "abc", modelData: { name: "General", startTime: "09:00" } }
 *   → { id: "abc", name: "General", startTime: "09:00" }
 */
export function flattenModelData(record) {
    if (!record) return record;
    const { modelData, ...rest } = record;
    return { ...rest, ...(modelData || {}) };
}

/**
 * Flatten an array of records.
 */
export function flattenModelDataArray(records) {
    if (!Array.isArray(records)) return records;
    return records.map(flattenModelData);
}

/**
 * Resolves an organizationId to an array of possible IDs (UUID + mongoId).
 * This handles the mismatch where some records store mongoId in organizationId
 * while the auth system resolves to UUID.
 */
export async function resolveOrgIds(orgId) {
    if (!orgId) return [];
    try {
        const org = await prisma.organization.findFirst({
            where: { OR: [{ id: orgId }, { mongoId: orgId }] },
            select: { id: true, mongoId: true }
        });
        if (org) {
            return [org.id, org.mongoId].filter(Boolean);
        }
    } catch (e) {
        // Fallback if query fails
    }
    return [orgId];
}

/**
 * Build an organizationId filter that matches both UUID and mongoId.
 */
export async function buildOrgFilter(orgId) {
    const ids = await resolveOrgIds(orgId);
    if (ids.length <= 1) return orgId;
    return { in: ids };
}

/**
 * Resolves mongoIds to UUIDs for fields on an Employee object
 * so that they match the options in UI dropdowns.
 */
export async function normalizeEmployeeRelationIds(emp, cache = new Map()) {
    if (!emp) return emp;

    const updated = { ...emp };

    const mappings = [
        { field: 'departmentId', model: 'department' },
        { field: 'employeeTypeId', model: 'employeeType' },
        { field: 'categoryId', model: 'employeeCategory' },
        { field: 'organizationId', model: 'organization' },
        { field: 'businessUnitId', model: 'businessUnit' },
        { field: 'teamId', model: 'team' },
        { field: 'defaultShift', model: 'workingShift' },
        { field: 'reportingManager', model: 'employee' },
        { field: 'teamLead', model: 'employee' }
    ];

    for (const item of mappings) {
        const val = updated[item.field];
        if (val && typeof val === 'string' && val.length === 24 && !val.includes('-')) {
            const cacheKey = `${item.model}:${val}`;
            if (cache.has(cacheKey)) {
                updated[item.field] = cache.get(cacheKey);
                continue;
            }
            try {
                const record = await prisma[item.model].findFirst({
                    where: { mongoId: val },
                    select: { id: true }
                });
                if (record) {
                    cache.set(cacheKey, record.id);
                    updated[item.field] = record.id;
                }
            } catch (e) {
                // Ignore query error
            }
        }
    }

    return updated;
}

/**
 * Normalize an array of Employee records.
 */
export async function normalizeEmployeeRelationIdsArray(employees) {
    if (!Array.isArray(employees)) return employees;
    const cache = new Map();
    return Promise.all(employees.map(emp => normalizeEmployeeRelationIds(emp, cache)));
}

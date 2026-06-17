const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetOrgId = "1713d3da-2293-43c2-a7f9-c15a35b9c453";
  console.log("=== STARTING FINANCE DATA BACKFILL ===");

  // 1. Fetch all employees to map MongoID -> UUID
  const employees = await prisma.employee.findMany();
  const empMap = {};
  employees.forEach(e => {
    empMap[e.id] = e.id;
    if (e.mongoId) {
      empMap[e.mongoId] = e.id;
    }
  });

  // 2. Backfill Expenses
  const expenses = await prisma.expense.findMany();
  console.log(`Processing ${expenses.length} expenses...`);
  for (const exp of expenses) {
    const mData = exp.modelData || {};
    const legacyEmpId = mData.employee;
    const resolvedEmpId = empMap[legacyEmpId] || exp.employeeId || null;

    await prisma.expense.update({
      where: { id: exp.id },
      data: {
        organizationId: targetOrgId,
        employeeId: resolvedEmpId
      }
    });
    console.log(`- Updated Expense ${exp.id}: orgId = ${targetOrgId}, employeeId = ${resolvedEmpId}`);
  }

  // 3. Backfill Vendors
  const vendors = await prisma.vendor.findMany();
  console.log(`Processing ${vendors.length} vendors...`);
  for (const v of vendors) {
    await prisma.vendor.update({
      where: { id: v.id },
      data: {
        organizationId: targetOrgId
      }
    });
    console.log(`- Updated Vendor ${v.id}: orgId = ${targetOrgId}`);
  }

  // 4. Backfill Vendor Invoices
  const invoices = await prisma.vendorInvoice.findMany();
  console.log(`Processing ${invoices.length} invoices...`);
  for (const inv of invoices) {
    await prisma.vendorInvoice.update({
      where: { id: inv.id },
      data: {
        organizationId: targetOrgId
      }
    });
    console.log(`- Updated Invoice ${inv.id}: orgId = ${targetOrgId}`);
  }

  console.log("=== FINANCE DATA BACKFILL COMPLETE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());

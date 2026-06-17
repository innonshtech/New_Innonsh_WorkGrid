const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== COST CENTERS ===");
  const ccs = await prisma.costCenter.findMany();
  console.log(`Total: ${ccs.length}`);
  console.log(JSON.stringify(ccs.map(c => ({ id: c.id, mongoId: c.mongoId, orgId: c.organizationId, code: (c.modelData || {}).code, name: (c.modelData || {}).name })), null, 2));

  console.log("\n=== EXPENSES ===");
  const expenses = await prisma.expense.findMany();
  console.log(`Total: ${expenses.length}`);
  console.log(JSON.stringify(expenses.slice(0, 5).map(e => ({ id: e.id, mongoId: e.mongoId, orgId: e.organizationId, data: e.modelData })), null, 2));

  console.log("\n=== VENDORS ===");
  const vendors = await prisma.vendor.findMany();
  console.log(`Total: ${vendors.length}`);
  console.log(JSON.stringify(vendors.slice(0, 5).map(v => ({ id: v.id, mongoId: v.mongoId, orgId: v.organizationId, name: (v.modelData || {}).name })), null, 2));

  console.log("\n=== VENDOR INVOICES ===");
  const invoices = await prisma.vendorInvoice.findMany();
  console.log(`Total: ${invoices.length}`);
  console.log(JSON.stringify(invoices.slice(0, 5).map(vi => ({ id: vi.id, mongoId: vi.mongoId, orgId: vi.organizationId, invoiceNo: (vi.modelData || {}).invoiceNo || (vi.modelData || {}).invoiceNumber })), null, 2));

  console.log("\n=== JOURNAL ENTRIES ===");
  const journalEntries = await prisma.journalEntry.findMany();
  console.log(`Total: ${journalEntries.length}`);
  console.log(JSON.stringify(journalEntries.slice(0, 5).map(j => ({ id: j.id, mongoId: j.mongoId, orgId: j.organizationId, ref: (j.modelData || {}).reference })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

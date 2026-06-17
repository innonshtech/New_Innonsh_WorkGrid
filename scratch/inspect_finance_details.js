const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany();
  console.log("=== EXPENSE MODEL DATA ===");
  expenses.forEach(e => {
    console.log(`ID: ${e.id}, MongoID: ${e.mongoId}`);
    console.log(JSON.stringify(e.modelData, null, 2));
  });

  const vendors = await prisma.vendor.findMany();
  console.log("=== VENDOR MODEL DATA ===");
  vendors.forEach(v => {
    console.log(`ID: ${v.id}, MongoID: ${v.mongoId}`);
    console.log(JSON.stringify(v.modelData, null, 2));
  });

  const invoices = await prisma.vendorInvoice.findMany();
  console.log("=== VENDOR INVOICES MODEL DATA ===");
  invoices.forEach(i => {
    console.log(`ID: ${i.id}, MongoID: ${i.mongoId}`);
    console.log(JSON.stringify(i.modelData, null, 2));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

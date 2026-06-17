const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const assets = await prisma.asset.findMany();
    console.log("=== Assets ===");
    console.log(JSON.stringify(assets, null, 2));

    const products = await prisma.productCatalog.findMany();
    console.log("\n=== Product Catalog ===");
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

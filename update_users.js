const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting user organization mapping update...");

    // Update aniketmpatil25@gmail.com (Innonsh Technologies)
    const u1 = await prisma.user.updateMany({
      where: { email: "aniketmpatil25@gmail.com" },
      data: { organizationId: "1713d3da-2293-43c2-a7f9-c15a35b9c453" }
    });
    console.log(`Updated aniketmpatil25@gmail.com count: ${u1.count}`);

    // Update info@innonsh.com (Innonsh Technologies)
    const u2 = await prisma.user.updateMany({
      where: { email: "info@innonsh.com" },
      data: { organizationId: "1713d3da-2293-43c2-a7f9-c15a35b9c453" }
    });
    console.log(`Updated info@innonsh.com count: ${u2.count}`);

    // Update admin@acmecorp.demo (Acme Corporation)
    const u3 = await prisma.user.updateMany({
      where: { email: "admin@acmecorp.demo" },
      data: { organizationId: "5f8cd105-52e5-4ff8-aaa7-f579a5458a11" }
    });
    console.log(`Updated admin@acmecorp.demo count: ${u3.count}`);

    console.log("Verification of users:");
    const updatedUsers = await prisma.user.findMany();
    console.log(JSON.stringify(updatedUsers.map(u => ({ email: u.email, role: u.role, organizationId: u.organizationId })), null, 2));

  } catch (error) {
    console.error("Error updating user org mappings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

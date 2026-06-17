const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUsers() {
  const users = await prisma.user.findMany({
      where: { role: 'admin' }
  });
  console.log("Admin users:", JSON.stringify(users.map(u => ({ id: u.id, mongoId: u.mongoId, role: u.role, orgId: u.organizationId })), null, 2));

  const superAdmins = await prisma.user.findMany({
      where: { role: 'super_admin' }
  });
  console.log("Super Admin users:", JSON.stringify(superAdmins.map(u => ({ id: u.id, mongoId: u.mongoId, role: u.role, orgId: u.organizationId })), null, 2));
}

testUsers().catch(console.error).finally(() => prisma.$disconnect());

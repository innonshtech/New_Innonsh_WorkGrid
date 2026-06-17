const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBankLogic() {
  const page = 1;
  const limit = 10;
  
  let banksRaw = await prisma.bank.findMany({
      orderBy: { createdAt: 'desc' }
  });

  const paginatedBanks = banksRaw.slice((page - 1) * limit, page * limit);
  const orgIds = [...new Set(paginatedBanks.map(b => b.organizationId).filter(Boolean))];
  
  const orgs = await prisma.organization.findMany({
      where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
      select: { id: true, mongoId: true, name: true }
  });
  
  const orgMap = new Map();
  orgs.forEach(o => {
      orgMap.set(o.id, o);
      if (o.mongoId) orgMap.set(o.mongoId, o);
  });

  const banks = paginatedBanks.map(b => {
      const org = b.organizationId ? orgMap.get(b.organizationId) : null;
      return {
          ...b,
          name: b.modelData?.name || "",
          _id: b.id,
          organizationId: org ? { _id: org.id, name: org.name } : null
      };
  });

  console.log(JSON.stringify({ success: true, data: banks }, null, 2));
}

testBankLogic().catch(console.error).finally(() => prisma.$disconnect());

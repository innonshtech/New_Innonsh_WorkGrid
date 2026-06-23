const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: { OR: [
      { email: { contains: 'aniket' } },
      { name: { contains: 'aniket' } },
      { name: { contains: 'Aniket' } }
    ] }
  });
  
  console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email, employeeId: u.employeeId })));
}

checkUsers().finally(() => setTimeout(() => prisma.$disconnect(), 1000));

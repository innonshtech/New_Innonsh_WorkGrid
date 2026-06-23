const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['aniketmpatil25@gmail.com', 'aniket.innonsh1@gmail.com'] }
    }
  });

  for (const u of users) {
    const isPassword123 = await bcrypt.compare('password123', u.password || '');
    const isAdmin123 = await bcrypt.compare('admin123', u.password || '');
    const isSecurePassword = await bcrypt.compare('SecureP@ssw0rd', u.password || '');
    console.log(`User: ${u.email}`, {
      isPassword123,
      isAdmin123,
      isSecurePassword,
      hasPassword: !!u.password
    });
  }

  const employee = await prisma.employee.findFirst({
    where: { email: 'aniket.innonsh@gmail.com' }
  });
  if (employee) {
    const isPassword123 = await bcrypt.compare('password123', employee.password || '');
    console.log(`Employee: ${employee.email}`, {
      isPassword123,
      hasPassword: !!employee.password
    });
  }
}

main().finally(() => prisma.$disconnect());

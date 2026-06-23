const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  // Update User table admin users
  const adminEmails = ['aniketmpatil25@gmail.com', 'aniket.innonsh1@gmail.com'];
  for (const email of adminEmails) {
    const updatedUser = await prisma.user.updateMany({
      where: { email },
      data: { password: hash }
    });
    console.log(`Updated User table email ${email}:`, updatedUser.count);
  }

  // Update Employee table employee user
  const employeeEmail = 'aniket.innonsh@gmail.com';
  const employee = await prisma.employee.findFirst({
    where: { email: employeeEmail }
  });
  if (employee) {
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: { password: hash }
    });
    console.log(`Updated Employee table email ${employeeEmail} (ID: ${employee.id})`);
  } else {
    console.log(`Employee with email ${employeeEmail} not found`);
  }
}

main().finally(() => prisma.$disconnect());

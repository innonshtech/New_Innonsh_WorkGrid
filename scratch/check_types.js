const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  const orgs = await prisma.organization.findMany();
  console.log('Organizations:', orgs.length);

  const depts = await prisma.department.findMany();
  console.log('Departments:', depts.length);

  const types = await prisma.employeeType.findMany();
  console.log('Employee Types:', types.length);

  const cats = await prisma.employeeCategory.findMany();
  console.log('Categories:', cats.length);

  const subCats = await prisma.employeeSubCategory.findMany();
  console.log('Sub Categories:', subCats.length);

  if (types.length > 0) {
      console.log('Sample Employee Type:', types[0]);
  }
  
  if (cats.length > 0) {
      console.log('Sample Category:', cats[0]);
  }

  process.exit(0);
}

checkData();

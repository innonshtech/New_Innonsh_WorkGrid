const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  const orgCache = {};
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
      if (org.mongoId) orgCache[org.mongoId] = org.id;
  }

  // Helper to map orgId
  function getOrgId(mongoId) {
      if (!mongoId) return undefined;
      return orgCache[mongoId.toString()] || undefined;
  }

  // 1. Department
  console.log('Migrating Departments...');
  const depts = await db.collection('departments').find({}).toArray();
  for (const doc of depts) {
      await prisma.department.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              businessUnitId: doc.businessUnitId?.toString(),
              departmentName: doc.departmentName || 'Unknown',
              status: doc.status || 'Active',
              permissions: doc.permissions || [],
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${depts.length} Departments`);

  // 2. OfficeLocation
  console.log('Migrating OfficeLocations...');
  const offices = await db.collection('officelocations').find({}).toArray();
  for (const doc of offices) {
      await prisma.officeLocation.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              locationName: doc.locationName || 'Unknown',
              address: doc.address || {},
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${offices.length} OfficeLocations`);

  // 3. Team
  console.log('Migrating Teams...');
  const teams = await db.collection('teams').find({}).toArray();
  for (const doc of teams) {
      await prisma.team.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              departmentId: doc.departmentId?.toString(),
              teamName: doc.teamName || 'Unknown',
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${teams.length} Teams`);

  // 4. BusinessUnit
  console.log('Migrating BusinessUnits...');
  const bus = await db.collection('businessunits').find({}).toArray();
  for (const doc of bus) {
      await prisma.businessUnit.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              unitName: doc.unitName || doc.name || 'Unknown',
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${bus.length} BusinessUnits`);

  // 5. Designation
  console.log('Migrating Designations...');
  const desigs = await db.collection('designations').find({}).toArray();
  for (const doc of desigs) {
      await prisma.designation.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              title: doc.title || doc.name || 'Unknown',
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${desigs.length} Designations`);

  // 6. EmployeeType
  console.log('Migrating EmployeeTypes...');
  const empTypes = await db.collection('employeetypes').find({}).toArray();
  for (const doc of empTypes) {
      await prisma.employeeType.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              type: doc.type || doc.name || 'Unknown',
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${empTypes.length} EmployeeTypes`);

  // 7. EmployeeCategory
  console.log('Migrating EmployeeCategories...');
  const empCats = await db.collection('employeecategories').find({}).toArray();
  for (const doc of empCats) {
      await prisma.employeeCategory.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              categoryName: doc.categoryName || doc.name || 'Unknown',
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${empCats.length} EmployeeCategories`);

  // 8. Role
  console.log('Migrating Roles...');
  const roles = await db.collection('roles').find({}).toArray();
  for (const doc of roles) {
      await prisma.role.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              organizationId: getOrgId(doc.organizationId),
              roleName: doc.roleName || doc.name || 'Unknown',
              permissions: doc.permissions || {},
              status: doc.status || 'Active',
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${roles.length} Roles`);

  // 9. Permission
  console.log('Migrating Permissions...');
  const perms = await db.collection('permissions').find({}).toArray();
  for (const doc of perms) {
      await prisma.permission.upsert({
          where: { mongoId: doc._id.toString() },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              module: doc.module || 'Unknown',
              actions: doc.actions || [],
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${perms.length} Permissions`);

  await mongoose.disconnect();
  await prisma.$disconnect();
}
run().catch(console.error);

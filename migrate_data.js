const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // 1. Users
  const users = await db.collection('users').find({}).toArray();
  for (const user of users) {
      await prisma.user.upsert({
          where: { mongoId: user._id.toString() },
          update: {},
          create: {
              mongoId: user._id.toString(),
              name: user.name || "Unknown",
              email: user.email || "unknown@example.com",
              password: user.password || "",
              role: user.role || "employee",
              roleId: user.roleId?.toString(),
              permissions: user.permissions || [],
              status: user.status || "active",
              companyName: user.companyName,
              phone: user.phone,
              industry: user.industry,
              companySize: user.companySize,
              plan: user.plan || "trial",
              planExpiresAt: user.planExpiresAt,
              isEmailVerified: user.isEmailVerified || false,
              department: user.department,
              position: user.position,
              employeeId: user.employeeId,
              isActive: user.isActive !== false,
              createdAt: user.createdAt || new Date(),
              updatedAt: user.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${users.length} Users`);

  // 2. Organizations
  const orgs = await db.collection('organizations').find({}).toArray();
  for (const org of orgs) {
      const creatorMongoId = org.createdBy?.toString();
      let createdById = undefined;

      if (creatorMongoId) {
          const u = await prisma.user.findUnique({ where: { mongoId: creatorMongoId }});
          if (u) createdById = u.id;
      }
      
      // Fallback: just use any admin user if createdBy is missing
      if (!createdById) {
          const anyAdmin = await prisma.user.findFirst();
          if (anyAdmin) createdById = anyAdmin.id;
      }

      if (!createdById) {
          console.warn(`Skipping org ${org.name} - No valid creator/users found.`);
          continue;
      }

      await prisma.organization.upsert({
          where: { mongoId: org._id.toString() },
          update: {},
          create: {
              mongoId: org._id.toString(),
              orgId: org.orgId || `ORG_${Date.now()}`,
              name: org.name || "Unknown Org",
              description: org.description,
              email: org.email || 'unknown@example.com',
              phone: org.phone,
              street: org.address?.street,
              status: org.status || "Active",
              website: org.website,
              memberCount: org.memberCount || 0,
              established: org.established,
              logo: org.logo,
              linkedinCompanyId: org.linkedinCompanyId,
              createdById: createdById,
              createdAt: org.createdAt || new Date(),
              updatedAt: org.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${orgs.length} Organizations`);

  await mongoose.disconnect();
  await prisma.$disconnect();
}
run().catch(console.error);

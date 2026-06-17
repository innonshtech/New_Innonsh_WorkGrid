const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function backfill() {
  console.log("🚀 Starting Talent Data Backfill...");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI is required to run backfill.");
    return;
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;

  // 1. BACKFILL SKILLS
  console.log("\n⏳ Backfilling Skills...");
  const mongoSkills = await db.collection('skills').find({}).toArray();
  console.log(`Found ${mongoSkills.length} skills in MongoDB.`);

  // Clean up any empty/dummy postgres skills first to prevent unique conflicts
  await prisma.skill.deleteMany({
    where: { employeeId: null }
  });
  console.log("Cleaned up template skill entries in PostgreSQL.");

  let skillsSuccess = 0;
  for (const doc of mongoSkills) {
    const mongoEmpId = doc.employee ? doc.employee.toString() : null;
    if (!mongoEmpId) {
      console.log(`   ⏭️ Skill '${doc.name}' has no employee associated. Skipping.`);
      continue;
    }

    // Find PostgreSQL Employee
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ id: mongoEmpId }, { mongoId: mongoEmpId }] }
    });

    if (!employee) {
      console.log(`   ⚠️ Employee with MongoID '${mongoEmpId}' not found in PostgreSQL. Skipping skill '${doc.name}'.`);
      continue;
    }

    const dataPayload = {
      mongoId: doc._id.toString(),
      employeeId: employee.id,
      name: doc.name,
      category: doc.category || "Technical",
      proficiency: Number(doc.proficiency) || 0,
      lastAssessed: doc.lastAssessed ? new Date(doc.lastAssessed) : new Date(),
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    };

    await prisma.skill.upsert({
      where: {
        employeeId_name: {
          employeeId: employee.id,
          name: doc.name
        }
      },
      update: dataPayload,
      create: dataPayload
    });
    skillsSuccess++;
  }
  console.log(`✅ Successfully backfilled ${skillsSuccess} skills.`);

  // 2. BACKFILL CAREER PATHS
  console.log("\n⏳ Backfilling Career Paths...");
  const careerPaths = await prisma.careerPath.findMany({});
  console.log(`Found ${careerPaths.length} career paths in PostgreSQL.`);

  let cpSuccess = 0;
  for (const cp of careerPaths) {
    const mData = cp.modelData && typeof cp.modelData === 'object' ? cp.modelData : {};
    const mongoEmpId = mData.employee || cp.employeeId;

    if (!mongoEmpId) {
      console.log(`   ⏭️ CareerPath '${cp.id}' has no employee reference. Skipping.`);
      continue;
    }

    const employee = await prisma.employee.findFirst({
      where: { OR: [{ id: mongoEmpId }, { mongoId: mongoEmpId }] }
    });

    if (!employee) {
      console.log(`   ⚠️ Employee with MongoID '${mongoEmpId}' not found in PostgreSQL. Skipping CareerPath.`);
      continue;
    }

    await prisma.careerPath.update({
      where: { id: cp.id },
      data: {
        employeeId: employee.id,
        organizationId: employee.organizationId || null
      }
    });
    cpSuccess++;
  }
  console.log(`✅ Successfully backfilled ${cpSuccess} career paths.`);

  await mongoose.disconnect();
  await prisma.$disconnect();
  console.log("\n🎉 Talent Data Backfill Complete!");
}

backfill().catch(console.error);

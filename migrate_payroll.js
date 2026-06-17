const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  const empCache = {};
  const sqlEmployees = await prisma.employee.findMany();
  for (const e of sqlEmployees) {
      if (e.mongoId) empCache[e.mongoId] = e.id;
  }

  const orgCache = {};
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
      if (org.mongoId) orgCache[org.mongoId] = org.id;
  }

  // 1. SalaryComponent
  console.log('Migrating SalaryComponents...');
  const components = await db.collection('salarycomponents').find({}).toArray();
  for (const doc of components) {
      await prisma.salaryComponent.upsert({
          where: { name: doc.name || 'Unknown' },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              name: doc.name || 'Unknown',
              type: doc.type || 'Earning',
              calculationType: doc.calculationType || 'Fixed',
              percentageOf: doc.percentageOf || 'Basic',
              defaultValue: doc.defaultValue || 0,
              category: doc.category || 'Standard',
              isTaxable: doc.isTaxable !== false,
              isStatutory: doc.isStatutory === true,
              enabled: doc.enabled !== false,
              description: doc.description,
              displayOrder: doc.displayOrder || 0,
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${components.length} SalaryComponents`);

  // 2. PayrollConfig
  console.log('Migrating PayrollConfigs...');
  const configs = await db.collection('payrollconfigs').find({}).toArray();
  for (const doc of configs) {
      const orgMongo = doc.company?.toString() || doc.organizationId?.toString();
      const dataPayload = {
          mongoId: doc._id.toString(),
          companyId: orgMongo ? orgCache[orgMongo] : undefined,
          configData: doc,
          createdAt: doc.createdAt || new Date(),
          updatedAt: doc.updatedAt || new Date()
      };
      await prisma.payrollConfig.upsert({
          where: { mongoId: doc._id.toString() },
          update: dataPayload,
          create: dataPayload
      });
  }
  console.log(`Migrated ${configs.length} PayrollConfigs`);

  // 3. PayrollRun
  console.log('Migrating PayrollRuns...');
  const runs = await db.collection('payrollruns').find({}).toArray();
  const runCache = {};
  for (const doc of runs) {
      const orgMongo = doc.organizationId?.toString();
      const dataPayload = {
          mongoId: doc._id.toString(),
          organizationId: orgMongo ? orgCache[orgMongo] : undefined,
          month: doc.month || 1,
          year: doc.year || 2024,
          status: doc.status || 'Draft',
          processedBy: doc.processedBy?.toString(),
          runData: doc,
          createdAt: doc.createdAt || new Date(),
          updatedAt: doc.updatedAt || new Date()
      };
      const newRun = await prisma.payrollRun.upsert({
          where: { mongoId: doc._id.toString() },
          update: dataPayload,
          create: dataPayload
      });
      runCache[doc._id.toString()] = newRun.id;
  }
  console.log(`Migrated ${runs.length} PayrollRuns`);

  // 4. Payslip
  console.log('Migrating Payslips...');
  const payslips = await db.collection('payslips').find({}).toArray();
  for (const doc of payslips) {
      const empMongo = doc.employee?.toString();
      const orgMongo = doc.organizationId?.toString();
      const runMongo = doc.payrollRunId?.toString();
      
      const sqlEmp = empMongo ? empCache[empMongo] : undefined;
      const sqlOrg = orgMongo ? orgCache[orgMongo] : 'Unknown';
      const sqlRun = runMongo ? runCache[runMongo] : undefined;

      if (!sqlEmp) continue;

      await prisma.payslip.upsert({
          where: { payslipId: doc.payslipId || `PS_${Date.now()}_${Math.random()}` },
          update: {},
          create: {
              mongoId: doc._id.toString(),
              employeeId: sqlEmp,
              organizationId: sqlOrg || 'Unknown',
              payrollRunId: sqlRun,
              payslipId: doc.payslipId || `PS_${Date.now()}_${Math.random()}`,
              month: doc.month || 1,
              year: doc.year || 2024,
              basicSalary: doc.basicSalary || 0,
              grossSalary: doc.grossSalary || 0,
              totalDeductions: doc.totalDeductions || 0,
              netSalary: doc.netSalary || 0,
              workingDays: doc.workingDays || 30,
              presentDays: doc.presentDays || 0,
              leaveDays: doc.leaveDays || 0,
              paidLeaveDays: doc.paidLeaveDays || 0,
              unpaidLeaveDays: doc.unpaidLeaveDays || 0,
              overtimeHours: doc.overtimeHours || 0,
              overtimeAmount: doc.overtimeAmount || 0,
              totalDays: doc.totalDays || 0,
              weeklyOffs: doc.weeklyOffs || 0,
              halfDays: doc.halfDays || 0,
              holidays: doc.holidays || 0,
              paidDays: doc.paidDays || 0,
              lopDays: doc.lopDays || 0,
              status: doc.status || 'Draft',
              paymentDate: doc.paymentDate,
              paymentMethod: doc.paymentMethod,
              notes: doc.notes,
              organizationName: doc.organizationName || 'Unknown',
              salaryType: doc.salaryType || 'monthly',
              employeeType: doc.employeeType,
              earnings: doc.earnings || [],
              deductions: doc.deductions || [],
              pfDetails: doc.pfDetails || {},
              esicDetails: doc.esicDetails || {},
              professionalTax: doc.professionalTax || 0,
              leaveDetails: doc.leaveDetails || {},
              isPFApplicable: doc.isPFApplicable || false,
              isESICApplicable: doc.isESICApplicable || false,
              isPTApplicable: doc.isPTApplicable || false,
              generatedById: doc.generatedBy?.toString() || 'System',
              approvedById: doc.approvedBy?.toString(),
              createdAt: doc.createdAt || new Date(),
              updatedAt: doc.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${payslips.length} Payslips`);

  // 5. Bonus
  console.log('Migrating Bonuses...');
  const bonuses = await db.collection('bonuses').find({}).toArray();
  for (const doc of bonuses) {
      const empMongo = doc.employeeId?.toString() || doc.employee?.toString();
      const dataPayload = {
          mongoId: doc._id.toString(),
          employeeId: empMongo ? empCache[empMongo] : undefined,
          amount: doc.amount || 0,
          reason: doc.reason,
          date: doc.date,
          status: doc.status || 'Pending',
          createdAt: doc.createdAt || new Date(),
          updatedAt: doc.updatedAt || new Date()
      };
      await prisma.bonus.upsert({
          where: { mongoId: doc._id.toString() },
          update: dataPayload,
          create: dataPayload
      });
  }
  console.log(`Migrated ${bonuses.length} Bonuses`);

  // 6. Loan
  console.log('Migrating Loans...');
  const loans = await db.collection('loans').find({}).toArray();
  for (const doc of loans) {
      const empMongo = doc.employeeId?.toString() || doc.employee?.toString();
      const dataPayload = {
          mongoId: doc._id.toString(),
          employeeId: empMongo ? empCache[empMongo] : undefined,
          amount: doc.amount || doc.principalAmount || 0,
          emi: doc.emi || doc.emiAmount,
          status: doc.status || 'Active',
          loanData: doc,
          createdAt: doc.createdAt || new Date(),
          updatedAt: doc.updatedAt || new Date()
      };
      await prisma.loan.upsert({
          where: { mongoId: doc._id.toString() },
          update: dataPayload,
          create: dataPayload
      });
  }
  console.log(`Migrated ${loans.length} Loans`);

  await mongoose.disconnect();
  await prisma.$disconnect();
}
run().catch(console.error);

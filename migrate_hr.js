const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Cache Organization lookups
  const orgCache = {};
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
      if (org.mongoId) orgCache[org.mongoId] = org.id;
  }

  // 1. Employees
  console.log('Migrating Employees...');
  const employees = await db.collection('employees').find({}).toArray();
  for (const emp of employees) {
      let organizationId = undefined;
      const orgMongoId = emp.jobDetails?.organizationId?.toString();
      if (orgMongoId && orgCache[orgMongoId]) {
          organizationId = orgCache[orgMongoId];
      }

      await prisma.employee.upsert({
          where: { mongoId: emp._id.toString() },
          update: {},
          create: {
              mongoId: emp._id.toString(),
              employeeId: emp.employeeId || `EMP_${Date.now()}`,
              password: emp.password,
              role: emp.role || 'employee',
              roleId: emp.roleId?.toString(),
              isCompliant: emp.isCompliant || false,
              isTDSApplicable: emp.isTDSApplicable || false,
              taxRegime: emp.taxRegime || 'new',
              firstName: emp.personalDetails?.firstName || 'Unknown',
              lastName: emp.personalDetails?.lastName || 'Unknown',
              email: emp.personalDetails?.email || `emp_${Date.now()}@example.com`,
              phone: emp.personalDetails?.phone || '0000000000',
              bloodGroup: emp.personalDetails?.bloodGroup,
              dateOfJoining: emp.personalDetails?.dateOfJoining || new Date(),
              dateOfBirth: emp.personalDetails?.dateOfBirth,
              gender: emp.personalDetails?.gender,
              department: emp.jobDetails?.department || 'General',
              departmentId: emp.jobDetails?.departmentId?.toString(),
              employeeType: emp.jobDetails?.employeeType,
              employeeTypeId: emp.jobDetails?.employeeTypeId?.toString(),
              category: emp.jobDetails?.category,
              categoryId: emp.jobDetails?.categoryId?.toString(),
              organizationId: organizationId,
              businessUnitId: emp.jobDetails?.businessUnitId?.toString(),
              teamId: emp.jobDetails?.teamId?.toString(),
              costCenterId: emp.jobDetails?.costCenterId?.toString(),
              designation: emp.jobDetails?.designation || 'Employee',
              reportingManager: emp.jobDetails?.reportingManager?.toString(),
              teamLead: emp.jobDetails?.teamLead?.toString(),
              workLocation: emp.jobDetails?.workLocation,
              assignedOfficeId: emp.jobDetails?.assignedOfficeId?.toString(),
              biometricDeviceId: emp.jobDetails?.biometricDeviceId,
              defaultShift: emp.jobDetails?.defaultShift?.toString(),
              workState: emp.jobDetails?.workState || 'Maharashtra',
              holidayListId: emp.jobDetails?.holidayListId?.toString(),
              bankAccountNumber: emp.salaryDetails?.bankAccount?.accountNumber,
              bankName: emp.salaryDetails?.bankAccount?.bankName,
              ifscCode: emp.salaryDetails?.bankAccount?.ifscCode,
              branch: emp.salaryDetails?.bankAccount?.branch,
              branchAddress: emp.salaryDetails?.bankAccount?.branchAddress,
              panNumber: emp.salaryDetails?.panNumber,
              aadharNumber: emp.salaryDetails?.aadharNumber,
              workingHr: emp.workingHr,
              otApplicable: emp.otApplicable || 'no',
              esicApplicable: emp.esicApplicable || 'no',
              pfApplicable: emp.pfApplicable || 'no',
              pfType: emp.pfType || 'restricted',
              probation: emp.probation || 'no',
              probationDuration: emp.probationDuration || 0,
              isAttending: emp.isAttending || 'no',
              gratuityApplicable: emp.gratuityApplicable || 'no',
              compOffBalance: emp.compOffBalance || 0,
              status: emp.status || 'Active',
              createdById: emp.createdBy?.toString(),
              updatedById: emp.updatedBy?.toString(),
              payslipStructure: emp.payslipStructure || {},
              variablePayStructure: emp.variablePayStructure || [],
              attendanceApproval: emp.attendanceApproval || {},
              documents: emp.documents || [],
              address: emp.personalDetails?.address || {},
              temporaryAddress: emp.personalDetails?.temporaryAddress || {},
              permanentAddress: emp.personalDetails?.permanentAddress || {},
              emergencyContact: emp.personalDetails?.emergencyContact || {},
              sessionToken: emp.sessionToken,
              forgotPasswordToken: emp.forgotPasswordToken,
              forgotPasswordExpires: emp.forgotPasswordExpires,
              createdAt: emp.createdAt || new Date(),
              updatedAt: emp.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${employees.length} Employees`);

  // Cache Employee lookups
  const empCache = {};
  const sqlEmployees = await prisma.employee.findMany();
  for (const e of sqlEmployees) {
      if (e.mongoId) empCache[e.mongoId] = e.id;
  }

  // Cache User lookups for Tickets
  const userCache = {};
  const sqlUsers = await prisma.user.findMany();
  for (const u of sqlUsers) {
      if (u.mongoId) userCache[u.mongoId] = u.id;
  }

  // 2. Attendance
  console.log('Migrating Attendance...');
  const attendances = await db.collection('attendances').find({}).toArray();
  for (const att of attendances) {
      const sqlEmpId = empCache[att.employee?.toString()];
      if (!sqlEmpId) continue;

      await prisma.attendance.upsert({
          where: { mongoId: att._id.toString() },
          update: {},
          create: {
              mongoId: att._id.toString(),
              employeeId: sqlEmpId,
              date: att.date,
              checkIn: att.checkIn,
              checkOut: att.checkOut,
              totalHours: att.totalHours || 0,
              status: att.status || 'Present',
              isProxy: att.isProxy || false,
              proxyDetails: att.proxyDetails || {},
              overtimeHours: att.overtimeHours || 0,
              dayType: att.dayType || 'Full',
              workedHours: att.workedHours || 0,
              notes: att.notes,
              location: att.location || {},
              attendanceMethod: att.attendanceMethod || 'Web',
              distanceFromOffice: att.distanceFromOffice,
              isGeofenceVerified: att.isGeofenceVerified || false,
              verificationFailureReason: att.verificationFailureReason,
              ipAddress: att.ipAddress,
              deviceId: att.deviceId,
              createdAt: att.createdAt || new Date(),
              updatedAt: att.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${attendances.length} Attendance records`);

  // 3. Leaves
  console.log('Migrating Leaves...');
  const leaves = await db.collection('leaves').find({}).toArray();
  for (const leave of leaves) {
      const sqlEmpId = empCache[leave.employeeId?.toString()];
      if (!sqlEmpId) continue;

      let sqlOrgId = undefined;
      const orgMongoId = leave.organizationId?.toString();
      if (orgMongoId && orgCache[orgMongoId]) {
          sqlOrgId = orgCache[orgMongoId];
      }

      await prisma.leave.upsert({
          where: { mongoId: leave._id.toString() },
          update: {},
          create: {
              mongoId: leave._id.toString(),
              employeeId: sqlEmpId,
              employeeCode: leave.employeeCode || 'UNKNOWN',
              employeeName: leave.employeeName || 'Unknown',
              organizationId: sqlOrgId,
              organizationType: leave.organizationType || 'Organization',
              department: leave.department || 'General',
              month: leave.month || 1,
              year: leave.year || new Date().getFullYear(),
              leaves: leave.leaves || [],
              summary: leave.summary || {},
              annualLeaveBalance: leave.annualLeaveBalance || {},
              status: leave.status || 'Draft',
              notes: leave.notes,
              createdById: leave.createdBy?.toString(),
              updatedById: leave.updatedBy?.toString(),
              createdAt: leave.createdAt || new Date(),
              updatedAt: leave.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${leaves.length} Leave records`);

  // 4. Helpdesk Tickets
  console.log('Migrating HelpdeskTickets...');
  const tickets = await db.collection('helpdesktickets').find({}).toArray();
  for (const ticket of tickets) {
      const sqlEmpId = empCache[ticket.employee?.toString()];
      if (!sqlEmpId) continue;

      let sqlAssignedTo = undefined;
      const assignedMongo = ticket.assignedTo?.toString();
      if (assignedMongo && userCache[assignedMongo]) {
          sqlAssignedTo = userCache[assignedMongo];
      }

      await prisma.helpdeskTicket.upsert({
          where: { mongoId: ticket._id.toString() },
          update: {},
          create: {
              mongoId: ticket._id.toString(),
              employeeId: sqlEmpId,
              subject: ticket.subject || 'No Subject',
              category: ticket.category || 'General',
              priority: ticket.priority || 'Medium',
              status: ticket.status || 'Open',
              description: ticket.description || '',
              comments: ticket.comments || [],
              assignedTo: sqlAssignedTo,
              createdAt: ticket.createdAt || new Date(),
              updatedAt: ticket.updatedAt || new Date()
          }
      });
  }
  console.log(`Migrated ${tickets.length} HelpdeskTickets`);

  await mongoose.disconnect();
  await prisma.$disconnect();
}
run().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApi() {
  const orgId = "1713d3da-2293-43c2-a7f9-c15a35b9c453";
  const orgMongoId = "6a0444985322ad791296f805";
  const employeeId = "6a0b002790c557bb4b2d3c28"; // Saket's MongoID
  const weekStartDate = "2026-05-31T18:30:00.000Z";

  // Resolve employee ID
  let resolvedEmployeeId = employeeId;
  let employeeMongoId = null;
  const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
      select: { id: true, mongoId: true }
  });
  if (emp) {
      resolvedEmployeeId = emp.id;
      employeeMongoId = emp.mongoId;
  }
  console.log("Resolved Employee ID:", resolvedEmployeeId);
  console.log("Employee Mongo ID:", employeeMongoId);

  // Fetch all timesheets
  const allTimesheets = await prisma.timesheet.findMany();
  console.log("All timesheets count:", allTimesheets.length);

  const filteredTimesheets = allTimesheets.filter(t => {
      const data = t.timesheetData || {};
      
      if (orgId) {
          const tOrgId = data.organizationId || t.organizationId;
          if (tOrgId !== orgId && tOrgId !== orgMongoId) return false;
      }
      
      if (employeeId) {
          const tEmpId = t.employeeId || data.employee;
          if (tEmpId !== resolvedEmployeeId && tEmpId !== employeeMongoId && tEmpId !== employeeId) return false;
      }
      
      if (weekStartDate) {
          const actualWeekStart = t.date || data.weekStartDate;
          if (!actualWeekStart) return false;
          
          const diffMs = Math.abs(new Date(actualWeekStart).getTime() - new Date(weekStartDate).getTime());
          if (diffMs > 24 * 60 * 60 * 1000) return false;
      }
      return true;
  });

  console.log("Filtered timesheets count:", filteredTimesheets.length);

  const employees = await prisma.employee.findMany({
      where: { organizationId: orgId }
  });

  const employeeMap = {};
  employees.forEach(emp => {
      const empData = {
          id: emp.id,
          _id: emp.id,
          employeeId: emp.employeeId,
          personalDetails: {
              firstName: emp.firstName,
              lastName: emp.lastName,
              email: emp.email,
              phone: emp.phone
          },
          jobDetails: {
              designation: emp.designation,
              department: emp.department
          }
      };
      employeeMap[emp.id] = empData;
      if (emp.mongoId) {
          employeeMap[emp.mongoId] = empData;
      }
  });

  const timesheets = filteredTimesheets.map(t => {
      const data = t.timesheetData || {};
      const empId = t.employeeId || data.employee;
      const employee = employeeMap[empId] || null;

      const submittedToId = data.submittedTo;
      const submittedTo = employeeMap[submittedToId] || null;

      const weekStartDate = t.date || data.weekStartDate || null;

      return {
          id: t.id,
          _id: t.id,
          ...t,
          ...data,
          totalHours: t.hours || data.totalHours || 0,
          weekStartDate,
          employee,
          submittedTo
      };
  });

  console.log("Mapped Timesheets:", JSON.stringify(timesheets, null, 2));

  if (timesheets.length > 0) {
      const targetTimesheet = timesheets[0];
      const allEntries = await prisma.timesheetEntry.findMany();
      console.log("All Timesheet Entries count:", allEntries.length);

      const projects = await prisma.project.findMany({
          where: { organizationId: orgId }
      });
      const projectMap = {};
      projects.forEach(proj => {
          projectMap[proj.id] = proj;
          if (proj.mongoId) {
              projectMap[proj.mongoId] = proj;
          }
      });

      const entries = allEntries.filter(entry => {
          const mData = entry.modelData || {};
          return mData.timesheet === targetTimesheet.id || mData.timesheet === targetTimesheet.mongoId || mData.timesheet === targetTimesheet._id;
      }).map(entry => {
          const mData = entry.modelData || {};
          const projId = mData.project;
          const proj = projectMap[projId] || null;
          
          return {
              id: entry.id,
              _id: entry.id,
              ...entry,
              ...mData,
              project: proj ? {
                  id: proj.id,
                  _id: proj.id,
                  name: proj.name
              } : projId
          };
      });

      console.log("Entries found:", entries.length);
      console.log("Entries details:", JSON.stringify(entries, null, 2));
  }
}

testApi().catch(console.error).finally(() => prisma.$disconnect());

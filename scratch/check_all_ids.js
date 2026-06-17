const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const org = await prisma.organization.findFirst({
    where: { id: "1713d3da-2293-43c2-a7f9-c15a35b9c453" }
  });
  console.log("Org:", { id: org.id, mongoId: org.mongoId, name: org.name });

  // Check what employee stores as organizationId
  const emp = await prisma.employee.findFirst({
    where: { designation: "Software Developer" },
    select: { organizationId: true, businessUnitId: true, departmentId: true, teamId: true, 
              reportingManager: true, assignedOfficeId: true, employeeTypeId: true, roleId: true }
  });
  console.log("Employee IDs:", emp);

  // Check BU
  const bu = await prisma.businessUnit.findFirst({
    where: { OR: [{ id: emp.businessUnitId }, { mongoId: emp.businessUnitId }] }
  });
  console.log("BU:", { id: bu?.id, mongoId: bu?.mongoId, unitName: bu?.unitName });

  // Check Department
  const dept = await prisma.department.findFirst({
    where: { OR: [{ id: emp.departmentId }, { mongoId: emp.departmentId }] }
  });
  console.log("Dept:", { id: dept?.id, mongoId: dept?.mongoId, departmentName: dept?.departmentName });

  // Check Team
  const team = await prisma.team.findFirst({
    where: { OR: [{ id: emp.teamId }, { mongoId: emp.teamId }] }
  });
  console.log("Team:", { id: team?.id, mongoId: team?.mongoId, name: team?.name });

  // Check EmployeeType
  const et = await prisma.employeeType.findFirst({
    where: { OR: [{ id: emp.employeeTypeId }, { mongoId: emp.employeeTypeId }] }
  });
  console.log("EmployeeType:", { id: et?.id, mongoId: et?.mongoId, employeeType: et?.employeeType });

  // Check OfficeLocation
  if (emp.assignedOfficeId) {
    const office = await prisma.officeLocation.findFirst({
      where: { OR: [{ id: emp.assignedOfficeId }, { mongoId: emp.assignedOfficeId }] }
    });
    console.log("Office:", { id: office?.id, mongoId: office?.mongoId, locationName: office?.locationName });
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());

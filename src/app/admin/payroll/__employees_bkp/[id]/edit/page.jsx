import EmployeeForm from '@/components/payroll/employee-form';
import prisma from '@/lib/db/prisma';

export default async function EmployeeEditPage({ params }) {
  const { id } = await params;

  // Fetch employee data
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ id }, { mongoId: id }] }
  });

  if (!emp) {
    return <div className="p-8 text-center text-red-500">Employee not found</div>;
  }

  const employeeDoc = {
    _id: emp.id,
    id: emp.id,
    mongoId: emp.mongoId,
    employeeId: emp.employeeId,
    organizationId: emp.organizationId,
    status: emp.status,
    ...(emp.modelData || {})
  };

  if (employeeDoc.jobDetails) {
    const jd = employeeDoc.jobDetails;
    if (jd.reportingManager) {
      const rm = await prisma.employee.findFirst({
        where: { OR: [{ id: jd.reportingManager }, { mongoId: jd.reportingManager }] }
      });
      if (rm) {
        const personalDetails = rm.modelData?.personalDetails || rm.personalDetails || {};
        jd.reportingManager = {
          _id: rm.id,
          employeeId: rm.employeeId,
          personalDetails: {
            firstName: personalDetails.firstName || "",
            lastName: personalDetails.lastName || ""
          }
        };
      }
    }
  }

  if (employeeDoc.attendanceApproval) {
    const aa = employeeDoc.attendanceApproval;
    if (aa.shift1Supervisor) {
      const s1 = await prisma.employee.findFirst({
        where: { OR: [{ id: aa.shift1Supervisor }, { mongoId: aa.shift1Supervisor }] }
      });
      if (s1) {
        const personalDetails = s1.modelData?.personalDetails || s1.personalDetails || {};
        aa.shift1Supervisor = {
          _id: s1.id,
          employeeId: s1.employeeId,
          personalDetails: {
            firstName: personalDetails.firstName || "",
            lastName: personalDetails.lastName || ""
          }
        };
      }
    }
    if (aa.shift2Supervisor) {
      const s2 = await prisma.employee.findFirst({
        where: { OR: [{ id: aa.shift2Supervisor }, { mongoId: aa.shift2Supervisor }] }
      });
      if (s2) {
        const personalDetails = s2.modelData?.personalDetails || s2.personalDetails || {};
        aa.shift2Supervisor = {
          _id: s2.id,
          employeeId: s2.employeeId,
          personalDetails: {
            firstName: personalDetails.firstName || "",
            lastName: personalDetails.lastName || ""
          }
        };
      }
    }
  }

  // Serialize the data for client component
  const employeeData = JSON.parse(JSON.stringify(employeeDoc));

  // Format dates if necessary
  if (employeeData.personalDetails?.dateOfJoining) {
    employeeData.personalDetails.dateOfJoining = new Date(
      employeeData.personalDetails.dateOfJoining
    )
      .toISOString()
      .split("T")[0];
  }
  if (employeeData.personalDetails?.dateOfBirth) {
    employeeData.personalDetails.dateOfBirth = new Date(
      employeeData.personalDetails.dateOfBirth
    )
      .toISOString()
      .split("T")[0];
  }

  return <EmployeeForm employeeData={employeeData} isEdit={true} />;
}
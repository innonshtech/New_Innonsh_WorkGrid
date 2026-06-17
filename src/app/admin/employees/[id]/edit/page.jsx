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
    role: emp.role,
    isCompliant: emp.isCompliant,
    isTDSApplicable: emp.isTDSApplicable,
    taxRegime: emp.taxRegime,
    status: emp.status,
    workingHr: emp.workingHr,
    otApplicable: emp.otApplicable,
    esicApplicable: emp.esicApplicable,
    pfApplicable: emp.pfApplicable,
    pfType: emp.pfType,
    probation: emp.probation,
    probationDuration: emp.probationDuration,
    isAttending: emp.isAttending,
    gratuityApplicable: emp.gratuityApplicable,
    compOffBalance: emp.compOffBalance,
    
    personalDetails: {
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      bloodGroup: emp.bloodGroup,
      dateOfJoining: emp.dateOfJoining,
      dateOfBirth: emp.dateOfBirth,
      gender: emp.gender,
      currentAddress: emp.address,
      address: emp.address,
      temporaryAddress: emp.temporaryAddress,
      permanentAddress: emp.permanentAddress,
    },
    
    jobDetails: {
      department: emp.department,
      departmentId: emp.departmentId,
      employeeType: emp.employeeType,
      employeeTypeId: emp.employeeTypeId,
      category: emp.category,
      categoryId: emp.categoryId,
      organizationId: emp.organizationId,
      businessUnitId: emp.businessUnitId,
      teamId: emp.teamId,
      costCenterId: emp.costCenterId,
      designation: emp.designation,
      reportingManager: emp.reportingManager,
      teamLead: emp.teamLead,
      workLocation: emp.workLocation,
      assignedOfficeId: emp.assignedOfficeId,
      biometricDeviceId: emp.biometricDeviceId,
      defaultShift: emp.defaultShift,
    },

    salaryDetails: {
      bankAccount: {
        accountNumber: emp.bankAccountNumber,
        bankName: emp.bankName,
        ifscCode: emp.ifscCode,
        branch: emp.branch,
        branchAddress: emp.branchAddress,
      },
      panNumber: emp.panNumber,
      aadharNumber: emp.aadharNumber,
    },
    
    attendanceApproval: emp.attendanceApproval || {},
    documents: emp.documents || [],
    payslipStructure: emp.payslipStructure || {},
    variablePayStructure: emp.variablePayStructure || {},
    emergencyContact: emp.emergencyContact || {},
    
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt
  };

  if (employeeDoc.jobDetails) {
    const jd = employeeDoc.jobDetails;
    // Store original IDs before populating — these are the mongoIds stored in the employee record
    const originalIds = {
      organizationId: jd.organizationId,
      businessUnitId: jd.businessUnitId,
      departmentId: jd.departmentId,
      teamId: jd.teamId,
      reportingManager: jd.reportingManager,
      assignedOfficeId: jd.assignedOfficeId,
      employeeTypeId: jd.employeeTypeId,
    };
    jd._originalIds = originalIds;

    if (jd.reportingManager) {
      const originalRmId = jd.reportingManager;
      const rm = await prisma.employee.findFirst({
        where: { OR: [{ id: jd.reportingManager }, { mongoId: jd.reportingManager }] }
      });
      if (rm) {
        jd.reportingManager = {
          _id: originalRmId,
          employeeId: rm.employeeId,
          personalDetails: {
            firstName: rm.firstName || "",
            lastName: rm.lastName || ""
          }
        };
      }
    }
    if (jd.organizationId) {
      const originalOrgId = jd.organizationId;
      const org = await prisma.organization.findFirst({
        where: { OR: [{ id: jd.organizationId }, { mongoId: jd.organizationId }] }
      });
      if (org) {
        jd.organizationId = { _id: originalOrgId, name: org.name };
      }
    }
    if (jd.departmentId) {
      const originalDeptId = jd.departmentId;
      const dep = await prisma.department.findFirst({
        where: { OR: [{ id: jd.departmentId }, { mongoId: jd.departmentId }] }
      });
      if (dep) {
        jd.departmentId = { _id: originalDeptId, departmentName: dep.departmentName };
      }
    }
    if (jd.businessUnitId) {
      const originalBuId = jd.businessUnitId;
      const bu = await prisma.businessUnit.findFirst({
        where: { OR: [{ id: jd.businessUnitId }, { mongoId: jd.businessUnitId }] }
      });
      if (bu) {
        jd.businessUnitId = { _id: originalBuId, name: bu.unitName };
      }
    }
    if (jd.teamId) {
      const originalTeamId = jd.teamId;
      const team = await prisma.team.findFirst({
        where: { OR: [{ id: jd.teamId }, { mongoId: jd.teamId }] }
      });
      if (team) {
        jd.teamId = { _id: originalTeamId, name: team.name || team.teamName };
      }
    }
    if (jd.employeeTypeId) {
      const originalEtId = jd.employeeTypeId;
      const et = await prisma.employeeType.findFirst({
        where: { OR: [{ id: jd.employeeTypeId }, { mongoId: jd.employeeTypeId }] }
      });
      if (et) {
        jd.employeeTypeId = { _id: originalEtId, employeeType: et.employeeType || et.type };
      }
    }
    if (jd.assignedOfficeId) {
      const originalOfficeId = jd.assignedOfficeId;
      const office = await prisma.officeLocation.findFirst({
        where: { OR: [{ id: jd.assignedOfficeId }, { mongoId: jd.assignedOfficeId }] }
      });
      if (office) {
        jd.assignedOfficeId = { _id: originalOfficeId, name: office.locationName };
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
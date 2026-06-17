const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmp() {
  const id = '6ed072e0-69d6-4b9e-a3d1-9eade58f4c24';
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ id }, { mongoId: id }] }
  });
  
  if (!emp) {
      console.log("Not found");
      return;
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

  console.log(JSON.stringify(employeeDoc, null, 2));
}

checkEmp().catch(console.error).finally(() => prisma.$disconnect());

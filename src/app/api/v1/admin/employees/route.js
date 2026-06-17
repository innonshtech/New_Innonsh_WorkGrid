import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';
import { buildOrgFilter, normalizeEmployeeRelationIdsArray } from '@/lib/utils/flatten-model';

function mapEmployeeToMongoose(emp) {
  if (!emp) return null;
  return {
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
    
    attendanceApproval: emp.attendanceApproval || {},
    documents: emp.documents || [],
    payslipStructure: emp.payslipStructure || {},
    variablePayStructure: emp.variablePayStructure || {},
    emergencyContact: emp.emergencyContact || {},
    
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt
  };
}

// Helper function to validate required fields
const validateEmployeeData = (data) => {
  const errors = [];
  if (data.role === 'attendance_only') {
    return errors;
  }
  if (!data.personalDetails?.firstName) {
    errors.push('First name is required');
  }
  if (!data.personalDetails?.lastName) {
    errors.push('Last name is required');
  }
  if (!data.personalDetails?.email) {
    errors.push('Email is required');
  }
  if (!data.personalDetails?.phone) {
    errors.push('Phone number is required');
  }
  if (!data.personalDetails?.dateOfJoining) {
    errors.push('Date of joining is required');
  }
  if (!data.jobDetails?.organizationId) {
    errors.push('Organization is required');
  }
  if (!data.jobDetails?.departmentId) {
    errors.push('Department is required');
  }
  if (!data.workingHr) {
    errors.push('Working hours are required');
  }
  if (!data.payslipStructure) {
    errors.push('Payslip structure is required');
  } else {
    if (!data.payslipStructure.basicSalary || data.payslipStructure.basicSalary <= 0) {
      errors.push('Basic salary must be greater than 0');
    }
    if (!data.payslipStructure.salaryType) {
      errors.push('Salary type is required');
    }
  }
  if (!data.salaryDetails?.bankAccount?.accountNumber) {
    errors.push('Bank account number is required');
  }
  if (!data.salaryDetails?.bankAccount?.bankName) {
    errors.push('Bank name is required');
  }
  if (!data.salaryDetails?.bankAccount?.ifscCode) {
    errors.push('IFSC code is required');
  }
  return errors;
};

// GET all employees with organization filtering
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const organizationId = searchParams.get('organizationId');
    const employeeType = searchParams.get('employeeType');
    const category = searchParams.get('category');
    const otApplicable = searchParams.get('otApplicable');
    const esicApplicable = searchParams.get('esicApplicable');
    const pfApplicable = searchParams.get('pfApplicable');
    const probation = searchParams.get('probation');
    const supervisorUserId = searchParams.get('supervisorUserId');
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;

    let where = {};

    // Filter by supervisor (only show employees assigned to this supervisor)
    if (supervisorUserId && supervisorUserId !== 'undefined') {
      let supervisorEmployeeId = null;

      try {
        const supervisorUser = await prisma.user.findFirst({ where: { OR: [{ id: supervisorUserId }, { mongoId: supervisorUserId }] } });
        if (supervisorUser?.employeeId) {
          supervisorEmployeeId = supervisorUser.employeeId;
        }
      } catch (e) {}

      let supervisorEmployee;
      if (supervisorEmployeeId) {
        supervisorEmployee = await prisma.employee.findFirst({ where: { employeeId: supervisorEmployeeId } });
      } else {
        try {
          supervisorEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: supervisorUserId }, { mongoId: supervisorUserId }] } });
        } catch (e) {}
      }

      if (supervisorEmployee) {
        const allEmployees = await prisma.employee.findMany({
          select: { id: true, mongoId: true, attendanceApproval: true }
        });

        const superviseeIds = allEmployees.filter(emp => {
          const aa = emp.attendanceApproval || {};
          return aa.shift1Supervisor === supervisorEmployee.id || 
                 aa.shift1Supervisor === supervisorEmployee.mongoId ||
                 aa.shift2Supervisor === supervisorEmployee.id || 
                 aa.shift2Supervisor === supervisorEmployee.mongoId;
        }).map(emp => emp.id);

        where.id = { in: superviseeIds };
      } else {
        where.id = { in: [] };
      }
    }

    if (authUser.role !== 'super_admin' && authUser.organizationId) {
      where.organizationId = await buildOrgFilter(authUser.organizationId);
    } else if (organizationId) {
      where.organizationId = await buildOrgFilter(organizationId);
    }
    if (department) {
      const dep = await prisma.department.findFirst({
        where: { OR: [{ id: department }, { mongoId: department }] },
        select: { id: true, mongoId: true }
      });
      if (dep) {
        where.departmentId = { in: [dep.id, dep.mongoId].filter(Boolean) };
      } else {
        where.departmentId = department;
      }
    }
    if (status) {
      where.status = status;
    }
    if (employeeType) {
      where.employeeType = employeeType;
    }
    if (category) {
      where.category = category;
    }
    if (otApplicable) {
      where.otApplicable = otApplicable;
    }
    if (esicApplicable) {
      where.esicApplicable = esicApplicable;
    }
    if (pfApplicable) {
      where.pfApplicable = pfApplicable;
    }
    if (probation) {
      where.probation = probation;
    }
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.employee.count({ where });

    // In-memory aggregations for filter counts
    const allEmployeesForStats = await prisma.employee.findMany({
      select: {
        status: true,
        category: true
      }
    });

    const statusMap = {};
    const categoryMap = {};
    
    allEmployeesForStats.forEach(emp => {
      const s = emp.status || 'Active';
      statusMap[s] = (statusMap[s] || 0) + 1;
      
      const c = emp.category || 'N/A';
      categoryMap[c] = (categoryMap[c] || 0) + 1;
    });

    const statusCounts = Object.keys(statusMap).map(k => ({ _id: k, count: statusMap[k] }));
    const categoryCounts = Object.keys(categoryMap).map(k => ({ _id: k, count: categoryMap[k] }));

    const normalizedEmployees = await normalizeEmployeeRelationIdsArray(employees);
    const mappedEmployees = normalizedEmployees.map(mapEmployeeToMongoose);

    return NextResponse.json({
      success: true,
      data: mappedEmployees,
      counts: {
        status: statusCounts,
        category: categoryCounts,
        experienceType: []
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v1/admin/employees:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Function to check document requirements and create reminders
async function checkDocumentRequirements(employee) {
  try {
    console.log("🔍 Checking document requirements for employee:", employee.employeeId);

    const requirements = await prisma.documentRequirement.findMany({ where: { status: 'Active' } });

    if (requirements.length === 0) {
      console.log("ℹ️ No active document requirements found");
      return;
    }

    const submittedDocs = employee.documents || [];
    const submittedTypes = submittedDocs.map(doc => doc.categoryName || doc.name);

    const missingDocuments = [];

    requirements.forEach(requirement => {
      const isRequired = requirement.isRequired || (requirement.modelData && requirement.modelData.isRequired);
      if (isRequired) {
        const docType = requirement.documentType || (requirement.modelData && requirement.modelData.documentType) || '';
        const reminderDays = requirement.reminderDays || (requirement.modelData && requirement.modelData.reminderDays) || 7;
        const isSubmitted = submittedTypes.some(type =>
          type.toLowerCase().includes(docType.toLowerCase()) ||
          docType.toLowerCase().includes(type.toLowerCase())
        );

        if (!isSubmitted) {
          missingDocuments.push({
            documentType: docType,
            reminderSent: false,
            reminderDate: new Date(),
            nextReminderDate: new Date(Date.now() + (reminderDays * 24 * 60 * 60 * 1000))
          });
        }
      }
    });

    if (missingDocuments.length > 0) {
      console.log(`📄 Creating document reminder for ${missingDocuments.length} missing documents`);

      await prisma.documentReminder.create({
        data: {
          employeeId: employee.id,
          status: 'pending',
          modelData: {
            missingDocuments,
            createdBy: employee.createdById || employee.updatedById
          }
        }
      });
    } else {
      console.log("✅ All required documents are submitted");
    }

  } catch (error) {
    console.error("❌ Error checking document requirements:", error);
  }
}

// CREATE new employee
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ['admin', 'super_admin']);

    const body = await request.json();
    console.log("📥 Received employee data:", JSON.stringify(body, null, 2));

    const validationErrors = validateEmployeeData(body);
    if (validationErrors.length > 0) {
      console.log("🚫 Validation errors:", validationErrors);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    const pDetails = body.personalDetails || {};
    const jDetails = body.jobDetails || {};
    const sDetails = body.salaryDetails || {};

    if (pDetails.email) {
      const existingEmail = await prisma.employee.findFirst({ where: { email: pDetails.email } });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    if (body.employeeId) {
      const existingEmployeeId = await prisma.employee.findFirst({ where: { employeeId: body.employeeId } });
      if (existingEmployeeId) {
        return NextResponse.json({ error: 'Employee ID already exists' }, { status: 400 });
      }
    }

    let employeeId = body.employeeId;

    if (!employeeId) {
      const lastEmployee = await prisma.employee.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      let newEmployeeId = "EMP001";

      if (lastEmployee && lastEmployee.employeeId) {
        const lastIdNumber = parseInt(lastEmployee.employeeId.replace(/\D/g, "")) || 0;
        newEmployeeId = `EMP${String(lastIdNumber + 1).padStart(3, "0")}`;
      }

      const existingWithId = await prisma.employee.findFirst({ where: { employeeId: newEmployeeId } });
      if (existingWithId) {
        const allEmployees = await prisma.employee.findMany({ select: { employeeId: true } });
        const usedNumbers = allEmployees.map((e) => parseInt((e.employeeId || "").replace(/\D/g, "")) || 0);
        let nextId = 1;
        for (const num of usedNumbers) {
          if (num === nextId) nextId++;
        }
        newEmployeeId = `EMP${String(nextId).padStart(3, "0")}`;
      }

      employeeId = newEmployeeId;
    }

    const isAttendanceOnly = body.role === 'attendance_only';

    const employeeData = {
      employeeId: employeeId,
      role: body.role || 'employee',
      password: body.password || null,
      isCompliant: body.isCompliant || false,
      isTDSApplicable: body.isTDSApplicable || false,
      taxRegime: body.taxRegime || 'new',
      
      firstName: pDetails.firstName || (isAttendanceOnly ? 'Attendance' : ''),
      lastName: pDetails.lastName || (isAttendanceOnly ? 'User' : ''),
      email: pDetails.email || (isAttendanceOnly ? `${employeeId.toLowerCase()}@attendance.local` : ''),
      phone: pDetails.phone || (isAttendanceOnly ? '0000000000' : ''),
      bloodGroup: pDetails.bloodGroup || '',
      dateOfJoining: pDetails.dateOfJoining ? new Date(pDetails.dateOfJoining) : new Date(),
      dateOfBirth: pDetails.dateOfBirth ? new Date(pDetails.dateOfBirth) : null,
      gender: pDetails.gender || (isAttendanceOnly ? 'Other' : ''),
      
      department: jDetails.department || (isAttendanceOnly ? 'Attendance' : ''),
      departmentId: jDetails.departmentId || null,
      employeeType: jDetails.employmentType || 'Full-Time',
      employeeTypeId: jDetails.employeeTypeId || null,
      category: body.category || jDetails.category || '',
      categoryId: jDetails.categoryId || null,
      organizationId: jDetails.organizationId || null,
      businessUnitId: jDetails.businessUnitId || null,
      teamId: jDetails.teamId || null,
      costCenterId: jDetails.costCenterId || null,
      designation: jDetails.designation || (isAttendanceOnly ? 'Attendance Operator' : ''),
      reportingManager: jDetails.reportingManager || null,
      teamLead: jDetails.teamLead || null,
      workLocation: jDetails.workLocation || '',
      assignedOfficeId: jDetails.assignedOfficeId || null,
      biometricDeviceId: jDetails.biometricDeviceId || '',
      defaultShift: jDetails.defaultShift || null,
      
      bankAccountNumber: sDetails.bankAccount?.accountNumber || (isAttendanceOnly ? '000000000' : ''),
      bankName: sDetails.bankAccount?.bankName || (isAttendanceOnly ? 'N/A' : ''),
      ifscCode: sDetails.bankAccount?.ifscCode || (isAttendanceOnly ? 'XXXX0000000' : ''),
      branch: sDetails.bankAccount?.branch || '',
      branchAddress: sDetails.bankAccount?.branchAddress || '',
      panNumber: sDetails.panNumber || '',
      aadharNumber: sDetails.aadharNumber || '',
      
      workingHr: parseFloat(body.workingHr) || 9,
      otApplicable: body.otApplicable || 'no',
      esicApplicable: body.esicApplicable || 'no',
      pfApplicable: body.pfApplicable || 'no',
      pfType: body.pfType || 'restricted',
      probation: body.probation || 'no',
      probationDuration: parseInt(body.probationDuration) || 0,
      isAttending: body.isAttending || 'no',
      gratuityApplicable: body.gratuityApplicable || 'no',
      
      attendanceApproval: body.attendanceApproval || {},
      documents: body.documents || [],
      payslipStructure: body.payslipStructure || {},
      variablePayStructure: body.variablePayStructure || {},
      address: pDetails.currentAddress || pDetails.address || {},
      temporaryAddress: pDetails.temporaryAddress || {},
      permanentAddress: pDetails.permanentAddress || {},
      emergencyContact: body.emergencyContact || {},
      
      status: body.status || 'Active',
      createdById: authUser.id
    };

    console.log("📝 Creating employee with data:", JSON.stringify(employeeData, null, 2));

    const employee = await prisma.employee.create({ data: employeeData });

    console.log("✅ Employee created successfully:", employee.employeeId);

    // Check document requirements and create reminders asynchronously
    checkDocumentRequirements(employee).catch(error => {
      console.error("Error in document requirement check:", error);
    });

    let performer = null;
    if (authUser.id) {
      performer = await prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
    }

    await logActivity({
      action: "created",
      entity: "Employee",
      entityId: employee.employeeId,
      description: `Created new employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
      performedBy: {
        userId: authUser.id,
        name: performer?.name || "Admin/User",
        email: performer?.email,
        role: performer?.role
      },
      details: {
        employeeId: employee.employeeId
      },
      req: request
    });

    return NextResponse.json({ success: true, data: mapEmployeeToMongoose(employee) }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/v1/admin/employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
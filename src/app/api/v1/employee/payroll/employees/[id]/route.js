import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { normalizeEmployeeRelationIds } from '@/lib/utils/flatten-model';

const cleanObjectId = (val) => {
  if (!val || val === '') return null;
  if (typeof val === 'object' && val._id) return val._id;
  return val;
};

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
}

// GET single employee
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    let employee = await prisma.employee.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

    // Fallback: Check if 'id' is a User ID
    if (!employee) {
      const user = await prisma.user.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
      if (user && user.employeeId) {
        employee = await prisma.employee.findFirst({ where: { employeeId: user.employeeId } });
      }
    }

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const normalizedEmployee = await normalizeEmployeeRelationIds(employee);
    return NextResponse.json(mapEmployeeToMongoose(normalizedEmployee));
  } catch (error) {
    console.error('❌ Error in GET /api/payroll/employees/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE employee
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("📥 Updating employee with data:", JSON.stringify(body, null, 2));

    const existingEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const pDetails = body.personalDetails || {};
    const jDetails = body.jobDetails || {};
    const sDetails = body.salaryDetails || {};
    const bAccount = sDetails.bankAccount || {};

    // Check if email is being changed and if it already exists
    if (pDetails.email && pDetails.email.toLowerCase() !== existingEmployee.email.toLowerCase()) {
      const existingEmail = await prisma.employee.findFirst({
        where: {
          email: pDetails.email.toLowerCase(),
          id: { not: existingEmployee.id }
        }
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      role: body.role || existingEmployee.role,
      password: body.password ? await bcrypt.hash(body.password, 10) : existingEmployee.password,
      isCompliant: (body.isCompliant !== undefined) ? body.isCompliant : existingEmployee.isCompliant,
      isTDSApplicable: (body.isTDSApplicable !== undefined) ? body.isTDSApplicable : existingEmployee.isTDSApplicable,
      taxRegime: body.taxRegime || existingEmployee.taxRegime,
      
      firstName: pDetails.firstName !== undefined ? pDetails.firstName : existingEmployee.firstName,
      lastName: pDetails.lastName !== undefined ? pDetails.lastName : existingEmployee.lastName,
      email: pDetails.email !== undefined ? pDetails.email.toLowerCase() : existingEmployee.email,
      phone: pDetails.phone !== undefined ? pDetails.phone : existingEmployee.phone,
      bloodGroup: pDetails.bloodGroup !== undefined ? pDetails.bloodGroup : existingEmployee.bloodGroup,
      dateOfJoining: pDetails.dateOfJoining ? new Date(pDetails.dateOfJoining) : existingEmployee.dateOfJoining,
      dateOfBirth: pDetails.dateOfBirth ? new Date(pDetails.dateOfBirth) : existingEmployee.dateOfBirth,
      gender: pDetails.gender !== undefined ? pDetails.gender : existingEmployee.gender,

      department: jDetails.department !== undefined ? jDetails.department : existingEmployee.department,
      departmentId: cleanObjectId(jDetails.departmentId) || existingEmployee.departmentId,
      employeeType: jDetails.employeeType !== undefined ? jDetails.employeeType : existingEmployee.employeeType,
      employeeTypeId: cleanObjectId(jDetails.employeeTypeId) || existingEmployee.employeeTypeId,
      category: jDetails.category !== undefined ? jDetails.category : existingEmployee.category,
      categoryId: cleanObjectId(jDetails.categoryId) || existingEmployee.categoryId,
      organizationId: cleanObjectId(jDetails.organizationId) || existingEmployee.organizationId,
      businessUnitId: cleanObjectId(jDetails.businessUnitId) || existingEmployee.businessUnitId,
      teamId: cleanObjectId(jDetails.teamId) || existingEmployee.teamId,
      costCenterId: cleanObjectId(jDetails.costCenterId) || existingEmployee.costCenterId,
      designation: jDetails.designation !== undefined ? jDetails.designation : existingEmployee.designation,
      reportingManager: cleanObjectId(jDetails.reportingManager) || existingEmployee.reportingManager,
      teamLead: cleanObjectId(jDetails.teamLead) || existingEmployee.teamLead,
      workLocation: jDetails.workLocation !== undefined ? jDetails.workLocation : existingEmployee.workLocation,
      assignedOfficeId: cleanObjectId(jDetails.assignedOfficeId) || existingEmployee.assignedOfficeId,
      biometricDeviceId: jDetails.biometricDeviceId !== undefined ? jDetails.biometricDeviceId : existingEmployee.biometricDeviceId,
      defaultShift: cleanObjectId(jDetails.defaultShift) || existingEmployee.defaultShift,

      bankAccountNumber: bAccount.accountNumber !== undefined ? bAccount.accountNumber : existingEmployee.bankAccountNumber,
      bankName: bAccount.bankName !== undefined ? bAccount.bankName : existingEmployee.bankName,
      ifscCode: bAccount.ifscCode !== undefined ? bAccount.ifscCode : existingEmployee.ifscCode,
      branch: bAccount.branch !== undefined ? bAccount.branch : existingEmployee.branch,
      branchAddress: bAccount.branchAddress !== undefined ? bAccount.branchAddress : existingEmployee.branchAddress,
      panNumber: sDetails.panNumber !== undefined ? sDetails.panNumber : existingEmployee.panNumber,
      aadharNumber: sDetails.aadharNumber !== undefined ? sDetails.aadharNumber : existingEmployee.aadharNumber,

      workingHr: (body.workingHr !== undefined) ? body.workingHr : existingEmployee.workingHr,
      otApplicable: body.otApplicable || existingEmployee.otApplicable,
      esicApplicable: body.esicApplicable || existingEmployee.esicApplicable,
      pfApplicable: body.pfApplicable || existingEmployee.pfApplicable,
      pfType: body.pfType || existingEmployee.pfType,
      probation: body.probation || existingEmployee.probation,
      probationDuration: (body.probationDuration !== undefined) ? body.probationDuration : existingEmployee.probationDuration,
      isAttending: body.isAttending || existingEmployee.isAttending,
      gratuityApplicable: body.gratuityApplicable || existingEmployee.gratuityApplicable,
      compOffBalance: (body.compOffBalance !== undefined) ? body.compOffBalance : existingEmployee.compOffBalance,
      status: body.status || existingEmployee.status,

      payslipStructure: body.payslipStructure !== undefined ? body.payslipStructure : existingEmployee.payslipStructure,
      variablePayStructure: body.variablePayStructure !== undefined ? body.variablePayStructure : existingEmployee.variablePayStructure,
      attendanceApproval: body.attendanceApproval !== undefined ? body.attendanceApproval : existingEmployee.attendanceApproval,
      documents: body.documents !== undefined ? body.documents : existingEmployee.documents,
      address: (pDetails.currentAddress || pDetails.address) !== undefined ? (pDetails.currentAddress || pDetails.address) : existingEmployee.address,
      temporaryAddress: pDetails.temporaryAddress !== undefined ? pDetails.temporaryAddress : existingEmployee.temporaryAddress,
      permanentAddress: pDetails.permanentAddress !== undefined ? pDetails.permanentAddress : existingEmployee.permanentAddress,
      emergencyContact: body.emergencyContact !== undefined ? body.emergencyContact : existingEmployee.emergencyContact,
      updatedById: body.updatedBy || null
    };

    console.log("📝 Final update data fields mapped.");

    const updatedEmployee = await prisma.employee.update({
      where: { id: existingEmployee.id },
      data: updateData
    });

    console.log("✅ Employee updated successfully in database:", updatedEmployee.employeeId);

    // Log activity
    let performer = null;
    if (body.updatedBy) {
      performer = await prisma.user.findFirst({ where: { OR: [{ id: body.updatedBy }, { mongoId: body.updatedBy }] } });
    }

    await logActivity({
      action: "updated",
      entity: "Employee",
      entityId: updatedEmployee.employeeId,
      description: `Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName} (${updatedEmployee.employeeId})`,
      performedBy: {
        userId: body.updatedBy,
        name: performer?.name || "Admin/User",
        email: performer?.email,
        role: performer?.role
      },
      details: {
        updates: Object.keys(updateData)
      },
      req: request
    });

    const normalizedEmployee = await normalizeEmployeeRelationIds(updatedEmployee);
    return NextResponse.json(mapEmployeeToMongoose(normalizedEmployee));
  } catch (error) {
    console.error('❌ Error in PUT /api/payroll/employees/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Partial update (used for status toggle)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    console.log(`🔄 Patching employee status to ${body.status}:`, id);

    const existingEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = await prisma.employee.update({
      where: { id: existingEmployee.id },
      data: {
        status: body.status,
        updatedAt: new Date()
      }
    });

    console.log("✅ Employee status updated:", employee.status);

    await logActivity({
      action: "updated",
      entity: "Employee",
      entityId: employee.employeeId,
      description: `Updated employee status to ${body.status}: ${employee.firstName} ${employee.lastName}`,
      performedBy: {
        userId: body.updatedBy
      },
      details: {
        status: body.status
      },
      req: request
    });

    const normalizedEmployee = await normalizeEmployeeRelationIds(employee);
    return NextResponse.json(mapEmployeeToMongoose(normalizedEmployee));
  } catch (error) {
    console.error('❌ Error in PATCH /api/payroll/employees/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE employee (soft delete or permanent delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isPermanent = searchParams.get('permanent') === 'true';

    const existingEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Permanent Delete
    if (isPermanent) {
      await prisma.employee.delete({ where: { id: existingEmployee.id } });

      console.log("✅ Employee permanently deleted:", existingEmployee.employeeId);

      await logActivity({
        action: "deleted",
        entity: "Employee",
        entityId: existingEmployee.employeeId,
        description: `Permanently deleted employee: ${existingEmployee.firstName} ${existingEmployee.lastName} (${existingEmployee.employeeId})`,
        req: request
      });

      return NextResponse.json({
        message: 'Employee permanently deleted successfully',
        id: existingEmployee.id
      });
    }

    // Soft Delete (Default)
    const employee = await prisma.employee.update({
      where: { id: existingEmployee.id },
      data: {
        status: 'Inactive',
        updatedAt: new Date()
      }
    });

    console.log("✅ Employee soft deleted (status changed to Inactive):", employee.employeeId);

    // Log activity
    await logActivity({
      action: "deleted",
      entity: "Employee",
      entityId: employee.employeeId,
      description: `Soft deleted employee (Inactive): ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
      req: request
    });

    return NextResponse.json({
      message: 'Employee status changed to Inactive successfully',
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      status: employee.status
    });
  } catch (error) {
    console.error('❌ Error in DELETE /api/payroll/employees/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { sendAttendanceThresholdNotification } from "@/utils/notifications";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

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

async function checkAttendanceThresholds(date) {
  try {
    console.log("🔍 Checking attendance thresholds for date:", date);

    const thresholds = await prisma.attendanceThreshold.findMany({ where: { status: 'Active' } });
    if (thresholds.length === 0) {
      return;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Present', 'Leave'] }
      }
    });

    const employeeIds = attendanceRecords.map(r => r.employeeId).filter(Boolean);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } }
    });
    const employeeMap = {};
    employees.forEach(e => {
        employeeMap[e.id] = e;
        if (e.mongoId) employeeMap[e.mongoId] = e;
    });

    const attendanceCount = {};
    attendanceRecords.forEach(record => {
      const employee = employeeMap[record.employeeId];
      if (!employee) return;

      const orgId = employee.organizationId || 'Unknown';
      const employeeType = employee.employeeType || 'Unknown';
      const subType = null;
      const key = `${orgId}-${employeeType}-${subType || 'null'}`;

      if (!attendanceCount[key]) {
        attendanceCount[key] = {
          organizationId: orgId,
          employeeType,
          subType,
          count: 0
        };
      }
      attendanceCount[key].count++;
    });

    for (const threshold of thresholds) {
      const criteria = threshold.modelData?.criteria || [];
      const thresholdVal = threshold.modelData?.threshold || 0;
      if (criteria.length === 0) continue;

      let currentTotalCount = 0;
      let breakdown = [];
      let involvedOrgs = new Set();
      let involvedCategories = new Set();

      for (const criterion of criteria) {
        const orgId = criterion.organizationId;
        const categoryName = criterion.categoryId || 'Unknown';
        const subType = criterion.subType;

        involvedOrgs.add(orgId);
        involvedCategories.add(categoryName);

        if (subType) {
          const key = `${orgId}-${categoryName}-${subType}`;
          currentTotalCount += attendanceCount[key]?.count || 0;
        } else {
          const prefix = `${orgId}-${categoryName}-`;
          Object.keys(attendanceCount).forEach(k => {
            if (k.startsWith(prefix)) {
              currentTotalCount += attendanceCount[k].count;
            }
          });
        }
        breakdown.push(`${orgId} - ${categoryName}`);
      }

      if (currentTotalCount > thresholdVal) {
        const groupName = [...involvedCategories].join(', ');
        const orgName = [...involvedOrgs].join(', ');

        await prisma.notification.create({
          data: {
            title: `Attendance Threshold Exceeded: ${groupName}`,
            message: `Combined count for ${breakdown.join(', ')} exceeded limit of ${thresholdVal} (current: ${currentTotalCount})`,
            type: 'threshold-exceeded',
            isRead: false
          }
        });

        try {
          await sendAttendanceThresholdNotification({
            employeeType: groupName,
            organization: orgName,
            currentCount: currentTotalCount,
            threshold: thresholdVal,
            date
          });
        } catch (emailError) {
          console.error('❌ Failed to send email notification:', emailError);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking attendance thresholds:", error);
  }
}

export async function GET(request) {
  try {
    const authUser = await getAuthUser();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const organizationId = searchParams.get("organizationId");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 100;
    const skip = (page - 1) * limit;

    let filter = {};

    // SaaS PROTECTION: Restrict data by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
      const orgEmployees = await prisma.employee.findMany({
          where: { organizationId: authUser.organizationId },
          select: { id: true, mongoId: true }
      });
      const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
      filter.employeeId = { in: empIds };
    } else if (authUser.role === "employee" || authUser.role === "attendance_only") {
      // Resolve employee ID
      let empId = authUser.id;
      const user = await prisma.user.findFirst({
          where: isValidUUID(authUser.id)
              ? { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
              : { mongoId: authUser.id }
      });
      if (user && user.employeeId) {
          const empRecord = await prisma.employee.findFirst({
              where: isValidUUID(user.employeeId)
                  ? { OR: [{ id: user.employeeId }, { employeeId: user.employeeId }] }
                  : { employeeId: user.employeeId }
          });
          if (empRecord) empId = empRecord.id;
      }
      filter.employeeId = empId;
    } else if (authUser.role === "super_admin" && organizationId) {
      const orgEmployees = await prisma.employee.findMany({
          where: { organizationId: organizationId },
          select: { id: true, mongoId: true }
      });
      const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
      filter.employeeId = { in: empIds };
    }

    // Date filtering
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      filter.date = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      filter.date = { gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { lte: new Date(endDate) };
    }

    // Employee filtering
    if (employeeId) {
      if (filter.employeeId && filter.employeeId.in) {
        if (filter.employeeId.in.includes(employeeId)) filter.employeeId = employeeId;
        else filter.employeeId = { in: [] };
      } else {
        filter.employeeId = employeeId;
      }
    }

    if (status) {
      filter.status = status;
    }
    
    const actualFilter = { ...filter };
    if (filter.employeeId && !filter.OR) {
        if (typeof filter.employeeId === 'string') {
            actualFilter.OR = [
                ...(isValidUUID(filter.employeeId) ? [{ employeeId: filter.employeeId }] : []),
                { employee: { mongoId: filter.employeeId } }
            ];
            delete actualFilter.employeeId;
        } else if (filter.employeeId.in) {
            const validUUIDs = filter.employeeId.in.filter(isValidUUID);
            actualFilter.OR = [
                ...validUUIDs.map(id => ({ employeeId: id })),
                ...filter.employeeId.in.map(id => ({ employee: { mongoId: id } }))
            ];
            delete actualFilter.employeeId;
        }
    }

    // Fetch attendance
    const attendance = await prisma.attendance.findMany({
      where: actualFilter,
      skip,
      take: limit,
      orderBy: { date: 'desc' }
    });

    const total = await prisma.attendance.count({ where: actualFilter });

    // Populate employee details for legacy response format
    const attendanceEmpIds = attendance.map(a => a.employeeId).filter(Boolean);
    const matchedEmployees = await prisma.employee.findMany({
        where: { id: { in: attendanceEmpIds } }
    });
    const empMap = {};
    matchedEmployees.forEach(e => {
        empMap[e.id] = mapEmployeeToMongoose(e);
        if (e.mongoId) empMap[e.mongoId] = mapEmployeeToMongoose(e);
    });

    const enrichedAttendance = attendance.map(a => ({
        ...a,
        _id: a.id,
        employee: empMap[a.employeeId] || null
      }));

    return NextResponse.json({
      success: true,
      attendance: enrichedAttendance,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();

    const body = await request.json();
    const {
      employee,
      date,
      checkIn,
      checkOut,
      status,
      isProxy,
      proxyDetails,
      overtimeHours,
      notes,
      location,
      ipAddress,
      deviceId,
      attendanceMethod = 'Web'
    } = body;

    if (!employee || !date || !status) {
      return NextResponse.json(
        { success: false, error: "Employee, date, and status are required" },
        { status: 400 }
      );
    }

    const empRecordForAuth = await prisma.employee.findFirst({
        where: isValidUUID(employee)
            ? { OR: [{ id: employee }, { mongoId: employee }] }
            : { mongoId: employee }
    });
    if (!empRecordForAuth) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
    if (authUser.role === "admin" && empRecordForAuth.organizationId !== authUser.organizationId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
    } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee.toString() && authUser.mongoId !== employee.toString()) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only log your own attendance" }, { status: 403 });
    }

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: empRecordForAuth.id,
            date: { gte: startOfDay, lte: endOfDay }
        }
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record already exists for this employee and date",
        },
        { status: 400 }
      );
    }

    // Geofencing verification
    let isGeofenceVerified = false;
    let distanceFromOffice = null;
    let verificationFailureReason = null;
    let attendanceStatus = status;

    if ((attendanceMethod === 'Mobile' || attendanceMethod === 'Web') && empRecordForAuth.assignedOfficeId && location?.coordinates) {
      const office = await prisma.officeLocation.findFirst({
        where: isValidUUID(empRecordForAuth.assignedOfficeId)
            ? { OR: [{ id: empRecordForAuth.assignedOfficeId }, { mongoId: empRecordForAuth.assignedOfficeId }] }
            : { mongoId: empRecordForAuth.assignedOfficeId }
      });
      if (office && office.status === 'Active') {
        const officeAddress = office.address || {};
        const coords = office.coordinates || office.modelData?.coordinates || officeAddress.coordinates || {};
        if (coords.latitude && coords.longitude) {
          const R = 6371e3; // metres
          const lat1 = location.coordinates[1] * Math.PI / 180;
          const lat2 = coords.latitude * Math.PI / 180;
          const deltaLat = (coords.latitude - location.coordinates[1]) * Math.PI / 180;
          const deltaLng = (coords.longitude - location.coordinates[0]) * Math.PI / 180;

          const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          distanceFromOffice = R * c;

          const allowedRadius = office.radius || office.modelData?.radius || officeAddress.radius || 100;

          if (distanceFromOffice <= allowedRadius) {
            isGeofenceVerified = true;
          } else {
            isGeofenceVerified = false;
            verificationFailureReason = `Outside allowed radius. Distance: ${Math.round(distanceFromOffice)}m, Allowed: ${allowedRadius}m`;
          }
        }
      }
    }

    let totalHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffMs = checkOutTime - checkInTime;
      totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const newAttendance = await prisma.attendance.create({ 
      data: {
        employeeId: empRecordForAuth.id,
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        totalHours,
        status: attendanceStatus,
        isProxy: isProxy || false,
        proxyDetails: isProxy ? proxyDetails : undefined,
        overtimeHours: overtimeHours || 0,
        notes,
        location: location ? {
          type: 'Point',
          coordinates: location.coordinates || [0, 0],
          accuracy: location.accuracy
        } : undefined,
        attendanceMethod,
        distanceFromOffice,
        isGeofenceVerified,
        verificationFailureReason,
        ipAddress,
        deviceId
      }
    });

    checkAttendanceThresholds(attendanceDate).catch(error => {
      console.error("Error in threshold check:", error);
    });

    const enrichedResult = {
        ...newAttendance,
        _id: newAttendance.id,
        employee: mapEmployeeToMongoose(empRecordForAuth)
    };

    return NextResponse.json({
      success: true,
      attendance: enrichedResult
    });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();

    const body = await request.json();
    const {
      employee,
      date,
      checkIn,
      checkOut,
      status,
      overtimeHours,
      notes,
      location
    } = body;

    const empRecordForAuth = await prisma.employee.findFirst({
        where: isValidUUID(employee)
            ? { OR: [{ id: employee }, { mongoId: employee }] }
            : { mongoId: employee }
    });
    if (!empRecordForAuth) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    if (authUser.role === "admin" && empRecordForAuth.organizationId !== authUser.organizationId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
    } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee.toString() && authUser.mongoId !== employee.toString()) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only update your own attendance" }, { status: 403 });
    }

    if (!employee || !date) {
      return NextResponse.json(
        { success: false, error: "Employee and date are required" },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    let updatedRecord = null;

    const existingRecord = await prisma.attendance.findFirst({
        where: {
            employeeId: empRecordForAuth.id,
            date: { gte: startOfDay, lte: endOfDay }
        }
    });

    if (!existingRecord) {
        return NextResponse.json({ success: false, error: "Attendance record not found" }, { status: 404 });
    }

    const updateData = {};
    if (checkIn) updateData.checkIn = new Date(checkIn);
    if (checkOut) updateData.checkOut = new Date(checkOut);
    if (status) updateData.status = status;
    if (overtimeHours !== undefined) updateData.overtimeHours = overtimeHours;
    if (notes !== undefined) updateData.notes = notes;
    if (location) updateData.location = location;

    const newCheckIn = checkIn ? new Date(checkIn) : existingRecord.checkIn;
    const newCheckOut = checkOut ? new Date(checkOut) : existingRecord.checkOut;

    if (newCheckIn && newCheckOut) {
      const diffMs = new Date(newCheckOut) - new Date(newCheckIn);
      updateData.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    updatedRecord = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: updateData
    });

    const enrichedResult = {
        ...updatedRecord,
        _id: updatedRecord.id,
        employee: mapEmployeeToMongoose(empRecordForAuth)
    };

    return NextResponse.json({
      success: true,
      attendance: enrichedResult
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const existingAttendance = await prisma.attendance.findFirst({
        where: isValidUUID(id) ? { OR: [{ id: id }, { mongoId: id }] } : { mongoId: id }
    });
    if (!existingAttendance) {
        return NextResponse.json({ success: false, error: "Attendance record not found" }, { status: 404 });
    }

    await prisma.attendance.delete({ where: { id: existingAttendance.id } });

    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
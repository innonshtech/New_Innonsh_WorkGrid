import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';






import { sendAttendanceThresholdNotification } from "@/utils/notifications";
import { getAuthUser, authorize } from "@/lib/auth-util";

// Function to check and notify attendance thresholds
// Function to check and notify attendance thresholds
async function checkAttendanceThresholds(date) {
  try {
    console.log("🔍 Checking attendance thresholds for date:", date);

    // Get all active thresholds
    const thresholdsRaw = await prisma.attendanceThreshold.findMany();
    const thresholds = thresholdsRaw
      .map(t => ({ id: t.id, ...t.modelData }))
      .filter(t => t.isActive === true);

    console.log(`ℹ️ Found ${thresholds.length} active attendance thresholds`);
    if (thresholds.length === 0) {
      console.log("ℹ️ No active attendance thresholds found");
      return;
    }

    // Get attendance records for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['Present', 'Leave'] } // Count present and on leave as active
      },
      include: {
        employee: true
      }
    });

    // Group attendance by organization, employee type, and subtype
    const attendanceCount = {};

    attendanceRecords.forEach(record => {
      const employee = record.employee;
      if (!employee) return;

      const orgId = employee.organizationId?.toString();
      const employeeType = employee.employeeType || 'Unknown';
      const subType = null;

      const key = `${orgId}-${employeeType}-${subType || 'null'}`;

      if (!attendanceCount[key]) {
        attendanceCount[key] = {
          organizationId: orgId,
          organizationName: employeeType,
          employeeType,
          subType,
          count: 0
        };
      }
      attendanceCount[key].count++;
    });

    console.log("📊 Attendance count by category:", attendanceCount);

    // Check each threshold
    for (const threshold of thresholds) {
      if (!threshold.criteria || threshold.criteria.length === 0) continue;

      let currentTotalCount = 0;
      let breakdown = [];
      let involvedOrgs = new Set();
      let involvedCategories = new Set();

      for (const criterion of threshold.criteria) {
        if (!criterion.organizationId) continue;

        const orgId = (criterion.organizationId.id || criterion.organizationId._id || '').toString();
        const categoryName = criterion.categoryId?.employeeCategory || criterion.employeeType || 'Unknown';
        const subType = criterion.subType;

        involvedOrgs.add(criterion.organizationId.name || 'Unknown');
        involvedCategories.add(categoryName);

        // Sum counts for this specific criterion
        if (subType) {
          const key = `${orgId}-${categoryName}-${subType}`;
          currentTotalCount += attendanceCount[key]?.count || 0;
        } else {
          // Match all subtypes for this org+category
          const prefix = `${orgId}-${categoryName}-`;
          Object.keys(attendanceCount).forEach(k => {
            if (k.startsWith(prefix)) {
              currentTotalCount += attendanceCount[k].count;
            }
          });
        }

        breakdown.push(`${criterion.organizationId.name || 'Unknown'} - ${categoryName}${subType ? ` (${subType})` : ''}`);
      }

      console.log(`🔍 Checking threshold: Total ${currentTotalCount} vs Limit ${threshold.threshold}`);

      if (currentTotalCount > threshold.threshold) {
        const groupName = [...involvedCategories].join(', ');
        const orgName = [...involvedOrgs].join(', ');

        console.log(`🚨 Threshold exceeded! Count: ${currentTotalCount}, Limit: ${threshold.threshold}`);

        // Create notification in database
        const primaryOrgId = threshold.criteria[0].organizationId?.id || threshold.criteria[0].organizationId?._id;
        let notification = await prisma.notification.create({
          data: {
            type: 'threshold-exceeded',
            title: `Attendance Threshold Exceeded: ${groupName}`,
            message: `Combined count for ${breakdown.join(', ')} exceeded limit of ${threshold.threshold} (current: ${currentTotalCount})`,
            isRead: false,
            employeeId: null
          }
        });

        console.log('✅ Threshold exceeded notification saved to database');

        // Send email notification
        try {
          await sendAttendanceThresholdNotification({
            employeeType: groupName,
            organization: orgName,
            currentCount: currentTotalCount,
            threshold: threshold.threshold,
            date
          });
        } catch (emailError) {
          console.error('❌ Failed to send email notification:', emailError);
        }
      }
    }

  } catch (error) {
    console.error("❌ Error checking attendance thresholds:", error);
    // Don't throw error to avoid breaking attendance creation
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
      // Find all employee IDs in this organization
      const orgEmployees = await prisma.employee.findMany({ 
        where: { organizationId: authUser.organizationId },
        select: { id: true }
      });
      const orgEmployeeIds = orgEmployees.map(e => e.id);
      filter.employeeId = { in: orgEmployeeIds };
    } else if (authUser.role === "employee" || authUser.role === "attendance_only") {
      // Employees can only see their own attendance
      filter.employeeId = authUser.id;
    } else if (authUser.role === "super_admin" && organizationId) {
      const orgEmployees = await prisma.employee.findMany({ 
        where: { organizationId: organizationId },
        select: { id: true }
      });
      const orgEmployeeIds = orgEmployees.map(e => e.id);
      filter.employeeId = { in: orgEmployeeIds };
    }

    // Date filtering - support both single date and date range
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (startDate && endDate) {
      // Date range filtering for monthly view
      filter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      filter.date = { gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { lte: new Date(endDate) };
    }

    // Employee filtering
    if (employeeId) {
      if (filter.employeeId && filter.employeeId.in) {
        const isAllowed = filter.employeeId.in.includes(employeeId);
        filter.employeeId = isAllowed ? employeeId : { in: [] };
      } else if (filter.employeeId && filter.employeeId.toString() !== employeeId.toString()) {
        filter.employeeId = { in: [] };
      } else {
        filter.employeeId = employeeId;
      }
    }

    // Status filtering
    if (status) {
      filter.status = status;
    }

    // Fetch attendance
    let attendance = await prisma.attendance.findMany({ 
      where: filter,
      skip,
      take: limit,
      orderBy: { date: 'desc' }
    });

    const total = await prisma.attendance.count({ where: filter });

    return NextResponse.json({
      success: true,
      attendance,
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
      location, // { coordinates: [lng, lat], accuracy }
      ipAddress,
      deviceId,
      attendanceMethod = 'Web' // Default
    } = body;

    // Validate required fields
    if (!employee || !date || !status) {
      return NextResponse.json(
        { success: false, error: "Employee, date, and status are required" },
        { status: 400 }
      );
    }

    // SaaS PROTECTION: Validate employee ownership
    const empRecordForAuth = await prisma.employee.findFirst({ where: { OR: [{ id: employee }, { mongoId: employee }] } });
    if (!empRecordForAuth) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
    if (authUser.role === "admin" && empRecordForAuth.organizationId?.toString() !== authUser.organizationId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
    } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee.toString()) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only log your own attendance" }, { status: 403 });
    }

    // Check for existing attendance on the same date
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findFirst({ where: {
      employeeId: employee,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    } });

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record already exists for this employee and date",
        },
        { status: 400 }
      );
    }

    // --- GEO-FENCING LOGIC START ---
    let isGeofenceVerified = false;
    let distanceFromOffice = null;
    let verificationFailureReason = null;
    let attendanceStatus = status;

    // Fetch employee details for geofencing check
    if (attendanceMethod === 'Mobile' || attendanceMethod === 'Web') {
      const employeeRecord = await prisma.employee.findFirst({ 
        where: { 
          OR: [{ id: employee }, { mongoId: employee }],
          assignedOfficeId: { not: null }
        } 
      });

      if (employeeRecord && employeeRecord.assignedOfficeId && location?.coordinates) {
        const office = await prisma.officeLocation.findFirst({
          where: { OR: [{ id: employeeRecord.assignedOfficeId }, { mongoId: employeeRecord.assignedOfficeId }] }
        });
        const officeData = office ? { status: office.status, ...(office.address || {}) } : null;
        if (officeData && officeData.status === 'Active' && officeData.coordinates) {
          // Calculate Distance (Haversine Formula) - Simple implementation
          const R = 6371e3; // metres
          const lat1 = location.coordinates[1] * Math.PI / 180; // lat
          const lat2 = officeData.coordinates.latitude * Math.PI / 180;
          const deltaLat = (officeData.coordinates.latitude - location.coordinates[1]) * Math.PI / 180;
          const deltaLng = (officeData.coordinates.longitude - location.coordinates[0]) * Math.PI / 180;

          const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          distanceFromOffice = R * c; // in meters

          const allowedRadius = officeData.radius || 100;

          if (distanceFromOffice <= allowedRadius) {
            isGeofenceVerified = true;
          } else {
            isGeofenceVerified = false;
            verificationFailureReason = `Outside allowed radius. Distance: ${Math.round(distanceFromOffice)}m, Allowed: ${allowedRadius}m`;
          }
        }
      }
    }
    // --- GEO-FENCING LOGIC END ---

    // Calculate total hours if both checkIn and checkOut are provided
    let totalHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffMs = checkOutTime - checkInTime;
      totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({ data: {
      employeeId: employee,
      date: attendanceDate,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      totalHours,
      status: attendanceStatus,
      isProxy: isProxy || false,
      proxyDetails: isProxy ? proxyDetails : undefined,
      overtimeHours: overtimeHours || 0,
      notes,
      location: {
        type: 'Point',
        coordinates: location?.coordinates || [0, 0],
        accuracy: location?.accuracy
      },
      attendanceMethod,
      distanceFromOffice,
      isGeofenceVerified,
      verificationFailureReason,
      ipAddress,
      deviceId,
    } });

    // Check attendance thresholds asynchronously (don't wait for completion)
    checkAttendanceThresholds(attendanceDate).catch(error => {
      console.error("Error in threshold check:", error);
    });

    return NextResponse.json({
      success: true,
      attendance,
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
      location,
    } = body;

    // SaaS PROTECTION: Validate employee ownership
    if (employee) {
      const empRecordForAuth = await prisma.employee.findFirst({ where: { OR: [{ id: employee }, { mongoId: employee }] } });
      if (empRecordForAuth) {
        if (authUser.role === "admin" && empRecordForAuth.organizationId?.toString() !== authUser.organizationId) {
          return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
        } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee.toString()) {
          return NextResponse.json({ success: false, error: "Forbidden: You can only update your own attendance" }, { status: 403 });
        }
      }
    }

    if (!employee || !date) {
      return NextResponse.json(
        { success: false, error: "Employee and date are required" },
        { status: 400 }
      );
    }

    // Find attendance record for the date
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendance.findFirst({ where: {
      employeeId: employee,
      date: { gte: startOfDay, lte: endOfDay },
    } });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Unified update data preparation
    const updateData = {};
    let finalCheckIn = existingRecord.checkIn;
    let finalCheckOut = existingRecord.checkOut;

    // Handle check-in time update
    if (checkIn !== undefined) {
      if (checkIn === null || checkIn === "") {
        updateData.checkIn = null;
        finalCheckIn = null;
      } else {
        const checkInTime = new Date(checkIn);
        updateData.checkIn = checkInTime;
        finalCheckIn = checkInTime;
      }
    }

    // Handle check-out time update
    if (checkOut !== undefined) {
      if (checkOut === null || checkOut === "") {
        updateData.checkOut = null;
        finalCheckOut = null;
      } else {
        const checkOutTime = new Date(checkOut);
        updateData.checkOut = checkOutTime;
        finalCheckOut = checkOutTime;
      }
    }

    if (status) {
      updateData.status = status;
    }
    if (overtimeHours !== undefined) {
      updateData.overtimeHours = overtimeHours;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (location) {
      updateData.location = location;
    }

    // Recalculate total hours if both check-in and check-out times are present
    if (finalCheckIn && finalCheckOut) {
      const diffMs = new Date(finalCheckOut) - new Date(finalCheckIn);
      updateData.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    } else {
      updateData.totalHours = 0;
    }

    await prisma.attendance.updateMany({ where: {
        employeeId: employee,
        date: { gte: startOfDay, lte: endOfDay },
      }, data: updateData });
      
    const updatedAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId: employee,
            date: { gte: startOfDay, lte: endOfDay },
        }
    });

    if (!updatedAttendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attendance: updatedAttendance,
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

    const deletedAttendance = await prisma.attendance.delete({ where: { id: (await prisma.attendance.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });

    if (!deletedAttendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

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
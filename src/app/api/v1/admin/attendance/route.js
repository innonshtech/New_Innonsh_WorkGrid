import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

// Triggering file refresh for Next.js build watcher
import { sendAttendanceThresholdNotification } from "@/utils/notifications";

import { getAuthUser, authorize } from "@/lib/auth-util";
import { resolveOrgIds, flattenModelData } from "@/lib/utils/flatten-model";

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Helper to map flat employee to the nested shape the frontend expects
function mapEmployeeForAttendance(emp) {
  if (!emp) return null;
  return {
    id: emp.id,
    _id: emp.id,
    mongoId: emp.mongoId,
    employeeId: emp.employeeId,
    personalDetails: {
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      dateOfJoining: emp.dateOfJoining,
      dateOfBirth: emp.dateOfBirth,
      gender: emp.gender,
    },
    jobDetails: {
      department: emp.department,
      departmentId: emp.departmentId,
      designation: emp.designation,
      employeeType: emp.employeeType,
      employeeTypeId: emp.employeeTypeId,
      category: emp.category,
      categoryId: emp.categoryId,
      organizationId: emp.organizationId,
      businessUnitId: emp.businessUnitId,
      teamId: emp.teamId,
      workLocation: emp.workLocation,
      assignedOfficeId: emp.assignedOfficeId,
      biometricDeviceId: emp.biometricDeviceId,
      defaultShift: emp.defaultShift,
    },
    status: emp.status,
  };
}

// Function to check and notify attendance thresholds
async function checkAttendanceThresholds(date) {
  try {
    console.log("🔍 Checking attendance thresholds for date:", date);

    // Get all active thresholds
    const thresholds = await prisma.attendanceThreshold.findMany({
      where: { isActive: true },
      include: {
        criteria: {
          include: {
            organization: { select: { name: true } },
            category: { select: { employeeCategory: true } }
          }
        }
      }
    });
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
        status: { in: ['Present', 'Leave'] }
      },
      include: {
        employee: {
          select: {
            organizationId: true,
            category: true,
            employeeType: true,
          }
        }
      }
    });

    // Group attendance by organization, employee type, and subtype
    const attendanceCount = {};

    attendanceRecords.forEach(record => {
      const employee = record.employee;
      if (!employee) return;

      const orgId = employee.organizationId;
      const employeeType = employee.category || employee.employeeType || 'Unknown';
      const subType = null;

      const key = `${orgId}-${employeeType}-${subType || 'null'}`;

      if (!attendanceCount[key]) {
        attendanceCount[key] = {
          organizationId: orgId,
          organizationName: 'Unknown',
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

        const orgId = criterion.organizationId;
        const categoryName = criterion.category?.employeeCategory || 'Unknown';
        const subType = criterion.subType;

        involvedOrgs.add(criterion.organization?.name);
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

        breakdown.push(`${criterion.organization?.name} - ${categoryName}${subType ? ` (${subType})` : ''}`);
      }

      console.log(`🔍 Checking threshold: Total ${currentTotalCount} vs Limit ${threshold.threshold}`);

      if (currentTotalCount > threshold.threshold) {
        const groupName = [...involvedCategories].join(', ');
        const orgName = [...involvedOrgs].join(', ');

        console.log(`🚨 Threshold exceeded! Count: ${currentTotalCount}, Limit: ${threshold.threshold}`);

        const notification = await prisma.notification.create({
          data: {
            type: 'threshold-exceeded',
            title: `Attendance Threshold Exceeded: ${groupName}`,
            message: `Combined count for ${breakdown.join(', ')} exceeded limit of ${threshold.threshold} (current: ${currentTotalCount})`,
            priority: 'high',
            read: false,
            organizationId: threshold.criteria[0].organizationId,
            details: {
              categoryName: groupName,
              organization: orgName,
              currentCount: currentTotalCount,
              threshold: threshold.threshold,
              exceededBy: currentTotalCount - threshold.threshold,
              date: date.toISOString()
            }
          }
        });
        console.log('✅ Threshold exceeded notification saved to database');

        try {
          await sendAttendanceThresholdNotification({
            employeeType: groupName,
            organization: orgName,
            currentCount: currentTotalCount,
            threshold: threshold.threshold,
            date
          });

          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              emailSent: true,
              emailRecipient: process.env.ATTENDANCE_THRESHOLD_EMAIL || process.env.SMTP_USER
            }
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

    let hasAttendanceViewPermission = false;
    if (authUser.role === "employee") {
      try {
        const employeeRecord = await prisma.employee.findFirst({
          where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] },
          select: { roleId: true }
        });
        if (employeeRecord && employeeRecord.roleId) {
          const roleData = await prisma.role.findFirst({
            where: { OR: [{ id: employeeRecord.roleId }, { mongoId: employeeRecord.roleId }] },
            select: { permissions: true }
          });
          if (roleData && roleData.permissions && roleData.permissions.includes("attendance.view")) {
            hasAttendanceViewPermission = true;
          }
        }
      } catch (err) {
        console.error("Error checking employee permission in attendance route:", err);
      }
    }

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

    let isPastDate = false;
    if (date) {
      const queryDate = new Date(date);
      const today = new Date();
      isPastDate = new Date(queryDate.toDateString()) < new Date(today.toDateString());
    }

    // --- SELF-HEALING & AUTO-ABSENT/LEAVE/HOLIDAY GENERATION FOR PAST DATES ---
    if (date && isPastDate) {
      const queryDate = new Date(date);
      const startOfQueryDay = new Date(queryDate);
      startOfQueryDay.setHours(0, 0, 0, 0);
      const endOfQueryDay = new Date(queryDate);
      endOfQueryDay.setHours(23, 59, 59, 999);

      // Fetch SaaS scoped active employees using flat fields
      let orgQuery = { status: "Active" };
      const targetOrg = authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null);
      if (targetOrg) {
        const orgIds = await resolveOrgIds(targetOrg);
        orgQuery.organizationId = { in: orgIds };
      }

      const activeEmployees = await prisma.employee.findMany({ where: orgQuery });

      // Find existing attendance records for this date
      const existingRecords = await prisma.attendance.findMany({
        where: {
          date: { gte: startOfQueryDay, lte: endOfQueryDay }
        }
      });
      const existingEmployeeIds = new Set(existingRecords.map(r => r.employeeId));

      // Check if there is an active Holiday for this date
      const holidayOrgIds = await resolveOrgIds(authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null));
      const holiday = await prisma.holiday.findFirst({
        where: {
          organizationId: { in: holidayOrgIds },
          date: { gte: startOfQueryDay, lte: endOfQueryDay },
          status: 'Active'
        }
      });

      const dayOfWeek = queryDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const approvedLeaves = await prisma.leaveApplication.findMany({
        where: {
          employeeId: { in: activeEmployees.map(e => e.id) },
          status: "Approved"
        }
      });

      // Self-heal: Create physical documents in the database for past dates
      for (const emp of activeEmployees) {
        if (!existingEmployeeIds.has(emp.id)) {
          try {
            const approvedLeave = approvedLeaves.find(l => {
              if (l.employeeId !== emp.id) return false;
              const sDateStr = l.modelData?.startDate;
              const eDateStr = l.modelData?.endDate;
              if (!sDateStr || !eDateStr) return false;
              const sDate = new Date(sDateStr);
              const eDate = new Date(eDateStr);
              return sDate <= endOfQueryDay && eDate >= startOfQueryDay;
            });

            let defaultStatus = "Absent";
            let notes = "Auto-marked Absent (Shift End)";
            
            if (approvedLeave) {
              const leaveType = approvedLeave.modelData?.leaveType;
              if (leaveType === 'WFH') {
                defaultStatus = "WFH";
                notes = "Work From Home (Approved)";
              } else if (leaveType === 'Half Day') {
                defaultStatus = "Half-day";
                notes = "Approved Half Day Leave";
              } else {
                defaultStatus = "Leave";
                notes = `Approved Leave: ${leaveType}`;
              }
            } else if (holiday) {
              defaultStatus = "Holiday";
              notes = `Holiday: ${holiday.name}`;
            } else if (isWeekend) {
              defaultStatus = "Weekend";
              notes = "Weekly Off";
            }

            await prisma.attendance.create({
              data: {
                employeeId: emp.id,
                date: queryDate,
                status: defaultStatus,
                checkIn: null,
                checkOut: null,
                totalHours: 0,
                notes: notes,
                location: {},
                attendanceMethod: 'System',
                distanceFromOffice: null,
                isGeofenceVerified: false,
                verificationFailureReason: null,
                ipAddress: null,
                deviceId: null,
              }
            });
          } catch (err) {
            console.error(`Failed to self-heal attendance for employee ${emp.id}:`, err);
          }
        }
      }
    }

    let filter = {};

    // SaaS PROTECTION: Restrict data by organization
    if (authUser.role !== "super_admin") {
      if ((authUser.role === "employee" && !hasAttendanceViewPermission) || authUser.role === "attendance_only") {
        filter.employeeId = authUser.id;
      } else {
        const orgIds = await resolveOrgIds(authUser.organizationId);
        const orgEmployees = await prisma.employee.findMany({
          where: { organizationId: { in: orgIds } },
          select: { id: true }
        }).then(results => results.map(r => r.id));
        filter.employeeId = { in: orgEmployees };
      }
    } else if (authUser.role === "super_admin" && organizationId) {
      const orgIds = await resolveOrgIds(organizationId);
      const orgEmployees = await prisma.employee.findMany({
        where: { organizationId: { in: orgIds } },
        select: { id: true }
      }).then(results => results.map(r => r.id));
      filter.employeeId = { in: orgEmployees };
    }

    // Date filtering
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
      } else if (filter.employeeId && filter.employeeId !== employeeId) {
        filter.employeeId = { in: [] };
      } else {
        filter.employeeId = employeeId;
      }
    }

    // Status filtering
    if (status) {
      filter.status = status;
    }

    // Fetch attendance with employee data (flat fields)
    let attendance = await prisma.attendance.findMany({
      where: filter,
      include: {
        employee: true,
      },
      orderBy: { date: 'desc' },
      skip: skip,
      take: limit,
    });

    // Map attendance records to include nested employee structure the frontend expects
    attendance = attendance.map(rec => ({
      ...rec,
      // proxyDetails is already Json, keep as-is
      employee: mapEmployeeForAttendance(rec.employee),
    }));


    // --- VIRTUAL ABSENT/WEEKEND/HOLIDAY/LEAVE GENERATION FOR TODAY ---
    if (date && !isPastDate) {
      const queryDate = new Date(date);
      // Find SaaS scoped active employees using flat fields
      let orgQuery = { status: "Active" };
      const targetOrg = authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null);
      if (targetOrg) {
        const orgIds = await resolveOrgIds(targetOrg);
        orgQuery.organizationId = { in: orgIds };
      }

      const activeEmployees = await prisma.employee.findMany({
        where: orgQuery,
      });

      // Get set of employee IDs present in the physical attendance response
      const physicalEmpIds = new Set(attendance.map(r => r.employee?.id || r.employeeId));

      // Check if there is an active Holiday for today
      const startOfQueryDay = new Date(queryDate);
      startOfQueryDay.setHours(0, 0, 0, 0);
      const endOfQueryDay = new Date(queryDate);
      endOfQueryDay.setHours(23, 59, 59, 999);
      const holidayOrgIds = await resolveOrgIds(authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null));
      const holiday = await prisma.holiday.findFirst({
        where: {
          organizationId: { in: holidayOrgIds },
          date: { gte: startOfQueryDay, lte: endOfQueryDay },
          status: 'Active'
        }
      });

      const dayOfWeek = queryDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const approvedLeaves = await prisma.leaveApplication.findMany({
        where: {
          employeeId: { in: activeEmployees.map(e => e.id) },
          status: "Approved"
        }
      });

      const virtualRecords = [];
      for (const emp of activeEmployees) {
        if (!physicalEmpIds.has(emp.id)) {
          if (employeeId && employeeId !== emp.id) continue;

          const approvedLeave = approvedLeaves.find(l => {
            if (l.employeeId !== emp.id) return false;
            const sDateStr = l.modelData?.startDate;
            const eDateStr = l.modelData?.endDate;
            if (!sDateStr || !eDateStr) return false;
            const sDate = new Date(sDateStr);
            const eDate = new Date(eDateStr);
            return sDate <= endOfQueryDay && eDate >= startOfQueryDay;
          });

          let defaultStatus = "Absent";
          let notes = "Expected Absent (No Clock-In Yet)";
          
          if (approvedLeave) {
            const leaveType = approvedLeave.modelData?.leaveType;
            if (leaveType === 'WFH') {
              defaultStatus = "WFH";
              notes = "Work From Home (Approved)";
            } else if (leaveType === 'Half Day') {
              defaultStatus = "Half-day";
              notes = "Approved Half Day Leave";
            } else {
              defaultStatus = "Leave";
              notes = `Approved Leave: ${leaveType}`;
            }
          } else if (holiday) {
            defaultStatus = "Holiday";
            notes = `Holiday: ${holiday.name}`;
          } else if (isWeekend) {
            defaultStatus = "Weekend";
            notes = "Weekly Off";
          }

          if (status && defaultStatus !== status) continue;

          virtualRecords.push({
            id: `virtual-${emp.id}-${date}`,
            employeeId: emp.id,
            employee: mapEmployeeForAttendance(emp),
            date: queryDate,
            status: defaultStatus,
            checkIn: null,
            checkOut: null,
            totalHours: 0,
            notes: notes,
            isVirtual: true,
            location: {},
            attendanceMethod: 'System',
            distanceFromOffice: null,
            isGeofenceVerified: false,
            verificationFailureReason: null,
            ipAddress: null,
            deviceId: null,
          });
        }
      }

      attendance = [...attendance, ...virtualRecords];
    }

    // --- DYNAMIC LATE-MINUTES & HALF-DAY CALCULATION ---
    const shiftOrgIds = await resolveOrgIds(authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null));
    const allOrgShifts = await prisma.workingShift.findMany({
      where: {
        organizationId: { in: shiftOrgIds }
      }
    });
    const rawDefaultShift = allOrgShifts.find(s => s.modelData?.isDefault === true) || allOrgShifts[0];
    const defaultShift = rawDefaultShift ? flattenModelData(rawDefaultShift) : null;

    attendance = await Promise.all(attendance.map(async (record) => {
      const rec = { ...record };
      
      if (rec.employee && rec.employee.id) {
        const recDate = new Date(rec.date);
        const startOfRecDay = new Date(recDate);
        startOfRecDay.setHours(0, 0, 0, 0);
        const endOfRecDay = new Date(recDate);
        endOfRecDay.setHours(23, 59, 59, 999);

        const roster = await prisma.shiftRoster.findFirst({
          where: {
            employeeId: rec.employee.id,
            date: { gte: startOfRecDay, lte: endOfRecDay }
          }
        });

        let shift = null;
        const rosterShiftId = roster?.shiftData?.shiftId;
        if (rosterShiftId) {
          const fetchedShift = allOrgShifts.find(s => s.id === rosterShiftId || s.mongoId === rosterShiftId) || 
            await prisma.workingShift.findFirst({ where: { OR: [{ id: rosterShiftId }, { mongoId: rosterShiftId }] } });
          if (fetchedShift) {
            shift = flattenModelData(fetchedShift);
          }
        }
        if (!shift) {
          shift = defaultShift;
        }

        const shiftStartStr = shift?.startTime || "09:00";
        const lateCutoffStr = shift?.lateCutoffTime || "09:15";
        const absentCutoffStr = shift?.absentCutoffTime || "11:00";
        const halfDayCutoffStr = shift?.halfDayCutoffTime || "12:30";
        const minHours = shift?.halfDayMinHours || 4;

        if (rec.checkIn && rec.status !== 'Absent' && rec.status !== 'On Leave') {
          const checkInTime = new Date(rec.checkIn);
          
          const [lateH, lateM] = lateCutoffStr.split(':').map(Number);
          const lateCutoffTime = new Date(checkInTime);
          lateCutoffTime.setHours(lateH, lateM, 0, 0);

          const [startH, startM] = shiftStartStr.split(':').map(Number);
          const shiftStartTime = new Date(checkInTime);
          shiftStartTime.setHours(startH, startM, 0, 0);

          if (checkInTime > lateCutoffTime) {
            const diffMs = checkInTime.getTime() - shiftStartTime.getTime();
            rec.lateMinutes = Math.floor(diffMs / (1000 * 60));
          } else {
            rec.lateMinutes = 0;
          }

          const [hdH, hdM] = halfDayCutoffStr.split(':').map(Number);
          const halfDayCutoffTime = new Date(checkInTime);
          halfDayCutoffTime.setHours(hdH, hdM, 0, 0);

          if (checkInTime > halfDayCutoffTime) {
            rec.status = 'Half-day';
            rec.notes = rec.notes ? `${rec.notes} (Auto Half-day: Checked-in after cutoff)` : "Auto Half-day: Checked-in after cutoff";
          } else if (rec.checkOut) {
            const totalHours = rec.totalHours || 0;
            if (totalHours > 0 && totalHours < minHours) {
              rec.status = 'Half-day';
              rec.notes = rec.notes ? `${rec.notes} (Auto Half-day: Worked hours < ${minHours}h)` : `Auto Half-day: Worked hours < ${minHours}h`;
            }
          }
        }
      } else {
        rec.lateMinutes = 0;
      }
      return rec;
    }));

    let total = await prisma.attendance.count({ where: filter });
    if (date && !isPastDate) {
      total = attendance.length;
    }

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
      employee, // This is employee ID
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

    // Use flat organizationId directly from employee
    if (authUser.role === "admin") {
      const authOrgIds = await resolveOrgIds(authUser.organizationId);
      if (!authOrgIds.includes(empRecordForAuth.organizationId)) {
        return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
      }
    } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only log your own attendance" }, { status: 403 });
    }

    // Check for existing attendance on the same date
    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
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

    // --- GEO-FENCING LOGIC START ---
    let isGeofenceVerified = false;
    let distanceFromOffice = null;
    let verificationFailureReason = null;
    let attendanceStatus = status;

    // Geofencing: use flat assignedOfficeId
    if (attendanceMethod === 'Mobile' || attendanceMethod === 'Web') {
      if (empRecordForAuth.assignedOfficeId && location?.coordinates) {
        try {
          const office = await prisma.officeLocation.findFirst({
            where: isValidUUID(empRecordForAuth.assignedOfficeId)
                ? { OR: [{ id: empRecordForAuth.assignedOfficeId }, { mongoId: empRecordForAuth.assignedOfficeId }] }
                : { mongoId: empRecordForAuth.assignedOfficeId }
          });

          if (office && office.status === 'Active') {
            const officeAddress = office.address || {};
            const coords = office.coordinates || office.modelData?.coordinates || officeAddress.coordinates;
            if (coords && coords.latitude && coords.longitude) {
              const R = 6371e3;
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
        } catch (geoErr) {
          console.error("Non-critical geofencing error:", geoErr);
        }
      }
    }
    // --- GEO-FENCING LOGIC END ---

    // Calculate total hours if both checkIn and checkOut are provided
    let totalHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    // Create attendance record
    const attendanceData = {
      employeeId: employee,
      date: attendanceDate,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      totalHours,
      status: attendanceStatus,
      isProxy: isProxy || false,
      proxyDetails: isProxy && proxyDetails ? proxyDetails : undefined,
      overtimeHours: overtimeHours || 0,
      notes,
      location: {
        coordinates: location?.coordinates || [0, 0],
        accuracy: location?.accuracy
      },
      attendanceMethod,
      distanceFromOffice,
      isGeofenceVerified,
      verificationFailureReason,
      ipAddress,
      deviceId,
    };

    const attendance = await prisma.attendance.create({
      data: attendanceData,
      include: {
        employee: true,
      }
    });

    const formattedAttendance = {
      ...attendance,
      employee: mapEmployeeForAttendance(attendance.employee),
    };

    // Check attendance thresholds asynchronously (don't wait for completion)
    checkAttendanceThresholds(attendanceDate).catch(error => {
      console.error("Error in threshold check:", error);
    });

    return NextResponse.json({
      success: true,
      attendance: formattedAttendance,
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
      employee, // This is employee ID
      date,
      checkIn,
      checkOut,
      status,
      overtimeHours,
      notes,
      location,
    } = body;

    // SaaS PROTECTION: Validate employee ownership using flat organizationId
    if (employee) {
      const empRecordForAuth = await prisma.employee.findFirst({ where: { OR: [{ id: employee }, { mongoId: employee }] } });
      if (empRecordForAuth) {
        if (authUser.role === "admin") {
          const authOrgIds = await resolveOrgIds(authUser.organizationId);
          if (!authOrgIds.includes(empRecordForAuth.organizationId)) {
            return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
          }
        } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee) {
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

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId: employee,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    const updateData = {};
    
    const effectiveCheckIn = checkIn !== undefined ? (checkIn ? new Date(checkIn) : null) : existingRecord.checkIn;
    const effectiveCheckOut = checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : existingRecord.checkOut;

    if (checkIn !== undefined) updateData.checkIn = effectiveCheckIn;
    if (checkOut !== undefined) updateData.checkOut = effectiveCheckOut;
    if (status !== undefined) updateData.status = status;
    if (overtimeHours !== undefined) updateData.overtimeHours = overtimeHours;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location;

    if (effectiveCheckIn && effectiveCheckOut) {
      const diffMs = effectiveCheckOut.getTime() - effectiveCheckIn.getTime();
      updateData.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    } else if (effectiveCheckOut === null) {
      updateData.totalHours = 0;
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: existingRecord.id },
      data: updateData,
      include: {
        employee: true,
      }
    });

    if (!updatedAttendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found after update" },
        { status: 404 }
      );
    }

    const formattedUpdatedAttendance = {
      ...updatedAttendance,
      employee: mapEmployeeForAttendance(updatedAttendance.employee),
    };

    // TRIGGER PAYROLL ALERT: If status changed
    try {
        const orgId = updatedAttendance.employee?.organizationId || authUser.organizationId;
        const month = attendanceDate.getMonth() + 1;
        const year = attendanceDate.getFullYear();

        if (status) {
            const activeRun = await prisma.payrollRun.findFirst({
                where: {
                    organizationId: orgId,
                    month,
                    year,
                    status: { in: ['Draft', 'Processing'] }
                }
            });

            if (activeRun) {
                await prisma.payrollRun.update({
                    where: { id: activeRun.id },
                    data: {
                        needsRecalculation: true,
                        recalculationReason: `Attendance status changed to "${status}" for ${updatedAttendance.employee?.firstName} ${updatedAttendance.employee?.lastName} on ${attendanceDate.toDateString()}`,
                        logs: {
                            push: {
                                message: `Recalculation advised: Attendance status updated to "${status}" for ${updatedAttendance.employee?.firstName} on ${attendanceDate.toDateString()}`,
                                level: 'warning',
                                employeeId: updatedAttendance.employee?.id
                            }
                        }
                    }
                });
                console.log(`[AttendanceAlert] Triggered recalculation alert for PayrollRun ${activeRun.runId}`);
            }
        }
    } catch (alertErr) {
        console.error("Non-critical error triggering payroll alert:", alertErr);
    }


    return NextResponse.json({
      success: true,
      attendance: formattedUpdatedAttendance,
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

    const record = await prisma.attendance.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] },
      include: {
        employee: {
          select: { organizationId: true }
        }
      }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Tenant Isolation Check
    if (authUser.role !== 'super_admin') {
      const recordOrgId = record.employee?.organizationId;
      const authOrgIds = await resolveOrgIds(authUser.organizationId);
      if (!authOrgIds.includes(recordOrgId)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Access is denied" },
          { status: 403 }
        );
      }
    }

    await prisma.attendance.delete({ where: { id: record.id } });

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
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { sendAttendanceThresholdNotification } from "@/utils/notifications";
import { getAuthUser, authorize } from "@/lib/auth-util";
import { resolveOrgIds, flattenModelData } from "@/lib/utils/flatten-model";

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}


async function checkAttendanceThresholds(date) {
  try {
    const thresholds = await prisma.attendanceThreshold.findMany({
        where: { status: 'Active' } // or isActive: true inside modelData
    });

    if (thresholds.length === 0) return;

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
            include: { organization: true }
        }
      }
    });

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
          organizationName: employee.organization?.name || 'Unknown',
          employeeType,
          subType,
          count: 0
        };
      }
      attendanceCount[key].count++;
    });

    for (const threshold of thresholds) {
      const criteria = threshold.modelData?.criteria || [];
      if (criteria.length === 0) continue;

      let currentTotalCount = 0;
      let breakdown = [];
      let involvedOrgs = new Set();
      let involvedCategories = new Set();

      for (const criterion of criteria) {
        if (!criterion.organizationId) continue;

        let orgData = await prisma.organization.findFirst({ where: { OR: [{ id: criterion.organizationId }, { mongoId: criterion.organizationId }] }});
        if (!orgData) continue;
        
        const orgId = orgData.id;
        const orgName = orgData.name;
        const categoryName = criterion.categoryId?.employeeCategory || 'Unknown';
        const subType = criterion.subType;

        involvedOrgs.add(orgName);
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

        breakdown.push(`${orgName} - ${categoryName}${subType ? ` (${subType})` : ''}`);
      }

      const thresholdValue = threshold.modelData?.threshold || 0;
      if (currentTotalCount > thresholdValue) {
        const groupName = [...involvedCategories].join(', ');
        const orgName = [...involvedOrgs].join(', ');

        const notification = await prisma.notificationConfig.create({
            data: {
                status: "Active",
                modelData: {
                  type: 'threshold-exceeded',
                  title: `Attendance Threshold Exceeded: ${groupName}`,
                  message: `Combined count for ${breakdown.join(', ')} exceeded limit of ${thresholdValue} (current: ${currentTotalCount})`,
                  priority: 'high',
                  read: false,
                  organization: criteria[0].organizationId,
                  details: {
                    categoryName: groupName,
                    organization: orgName,
                    currentCount: currentTotalCount,
                    threshold: thresholdValue,
                    exceededBy: currentTotalCount - thresholdValue,
                    date
                  }
                }
            }
        });

        try {
          await sendAttendanceThresholdNotification({
            employeeType: groupName,
            organization: orgName,
            currentCount: currentTotalCount,
            threshold: thresholdValue,
            date
          });

          await prisma.notificationConfig.update({
              where: { id: notification.id },
              data: {
                  modelData: {
                      ...notification.modelData,
                      emailSent: true,
                      emailRecipient: process.env.ATTENDANCE_THRESHOLD_EMAIL || process.env.SMTP_USER
                  }
              }
          });
        } catch (emailError) {}
      }
    }
  } catch (error) {}
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

    let isPastDate = false;
    if (date) {
      const queryDate = new Date(date);
      const today = new Date();
      isPastDate = new Date(queryDate.toDateString()) < new Date(today.toDateString());
    }

    if (date && isPastDate) {
      const queryDate = new Date(date);
      const startOfQueryDay = new Date(queryDate);
      startOfQueryDay.setHours(0, 0, 0, 0);
      const endOfQueryDay = new Date(queryDate);
      endOfQueryDay.setHours(23, 59, 59, 999);

      let orgQuery = { status: "Active" };
      if (authUser.role === "admin" || authUser.role === "supervisor") {
        const orgIds = await resolveOrgIds(authUser.organizationId);
        orgQuery.organizationId = { in: orgIds };
      } else if (authUser.role === "employee" || authUser.role === "attendance_only") {
        orgQuery.id = authUser.id; // Or mongoId
      } else if (authUser.role === "super_admin" && organizationId) {
        const orgIds = await resolveOrgIds(organizationId);
        orgQuery.organizationId = { in: orgIds };
      }

      const activeEmployees = await prisma.employee.findMany({ where: orgQuery });

      const existingRecords = await prisma.attendance.findMany({
        where: { date: { gte: startOfQueryDay, lte: endOfQueryDay } }
      });
      const existingEmployeeIds = new Set(existingRecords.map(r => r.employeeId));

      const holidayOrgIds = await resolveOrgIds(authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null));
      const holiday = await prisma.holiday.findFirst({
        where: {
            organizationId: { in: holidayOrgIds },
            date: { gte: startOfQueryDay, lte: endOfQueryDay },
            status: 'Active'
        }
      });
      const validHoliday = holiday;

      const dayOfWeek = queryDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const approvedLeaves = await prisma.leaveApplication.findMany({
        where: {
          employeeId: { in: activeEmployees.map(e => e.id) },
          status: "Approved"
        }
      });

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
            let isValidLeave = !!approvedLeave;
            let leaveType = approvedLeave?.modelData?.leaveType || '';

            let defaultStatus = "Absent";
            let notes = "Auto-marked Absent (Shift End)";
            
            if (isValidLeave) {
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
            } else if (validHoliday) {
              defaultStatus = "Holiday";
              notes = `Holiday: ${validHoliday.modelData?.name}`;
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
                  notes: notes
              }
            });
          } catch (err) {}
        }
      }
    }

    let filter = {};

    if (authUser.role === "admin" || authUser.role === "supervisor") {
      const orgIds = await resolveOrgIds(authUser.organizationId);
      const orgEmployees = await prisma.employee.findMany({ 
        where: { organizationId: { in: orgIds } },
        select: { id: true, mongoId: true }
      });
      const ids = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
      filter.employeeId = { in: ids };
    } else if (authUser.role === "employee" || authUser.role === "attendance_only") {
      filter.employeeId = authUser.id;
    } else if (authUser.role === "super_admin" && organizationId) {
      const orgIds = await resolveOrgIds(organizationId);
      const orgEmployees = await prisma.employee.findMany({ 
        where: { organizationId: { in: orgIds } },
        select: { id: true, mongoId: true }
      });
      const ids = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
      filter.employeeId = { in: ids };
    }

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

    if (employeeId) {
      if (filter.employeeId && filter.employeeId.in) {
        const isAllowed = filter.employeeId.in.includes(employeeId);
        filter.employeeId = isAllowed ? employeeId : { in: [] };
      } else {
        filter.employeeId = employeeId;
      }
    }

    if (status) filter.status = status;

    const actualFilter = { ...filter };
    if (filter.employeeId && !filter.OR) {
        if (typeof filter.employeeId === 'string') {
            actualFilter.OR = [{ employeeId: filter.employeeId }, { employee: { mongoId: filter.employeeId } }];
            delete actualFilter.employeeId;
        } else if (filter.employeeId.in) {
            actualFilter.OR = filter.employeeId.in.map(id => ({ employeeId: id })).concat(filter.employeeId.in.map(id => ({ employee: { mongoId: id } })));
            delete actualFilter.employeeId;
        }
    }

    let attendance = await prisma.attendance.findMany({
      where: actualFilter,
      include: {
        employee: {
            select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, organizationId: true, organization: { select: { name: true } } }
        }
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit
    });

    // VIRTUAL ABSENT GENERATION
    if (date && !isPastDate) {
      const queryDate = new Date(date);
      let orgQuery = { status: "Active" };
      if (authUser.role === "admin" || authUser.role === "supervisor") {
        const orgIds = await resolveOrgIds(authUser.organizationId);
        orgQuery.organizationId = { in: orgIds };
      } else if (authUser.role === "employee" || authUser.role === "attendance_only") {
        orgQuery.id = authUser.id;
      } else if (authUser.role === "super_admin" && organizationId) {
        const orgIds = await resolveOrgIds(organizationId);
        orgQuery.organizationId = { in: orgIds };
      }

      const activeEmployees = await prisma.employee.findMany({ where: orgQuery, include: { organization: true } });
      const physicalEmpIds = new Set(attendance.map(r => r.employeeId));

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
      const validHoliday = holiday;

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
          if (employeeId && employeeId !== emp.id && employeeId !== emp.mongoId) continue;

          const approvedLeave = approvedLeaves.find(l => {
            if (l.employeeId !== emp.id) return false;
            const sDateStr = l.modelData?.startDate;
            const eDateStr = l.modelData?.endDate;
            if (!sDateStr || !eDateStr) return false;
            const sDate = new Date(sDateStr);
            const eDate = new Date(eDateStr);
            return sDate <= endOfQueryDay && eDate >= startOfQueryDay;
          });
          
          let isValidLeave = !!approvedLeave;
          let leaveType = approvedLeave?.modelData?.leaveType || '';

          let defaultStatus = "Absent";
          let notes = "Expected Absent (No Clock-In Yet)";
          
          if (isValidLeave) {
            if (leaveType === 'WFH') { defaultStatus = "WFH"; notes = "Work From Home (Approved)"; }
            else if (leaveType === 'Half Day') { defaultStatus = "Half-day"; notes = "Approved Half Day Leave"; }
            else { defaultStatus = "Leave"; notes = `Approved Leave: ${leaveType}`; }
          } else if (validHoliday) {
            defaultStatus = "Holiday"; notes = `Holiday: ${validHoliday.name}`;
          } else if (isWeekend) {
            defaultStatus = "Weekend"; notes = "Weekly Off";
          }

          if (status && defaultStatus !== status) continue;

          virtualRecords.push({
            _id: `virtual-${emp.id}-${date}`,
            employee: {
                id: emp.id,
                mongoId: emp.mongoId,
                _id: emp.mongoId || emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email
                },
                jobDetails: { organizationId: { name: emp.organization?.name } }
            },
            date: queryDate,
            status: defaultStatus,
            checkIn: null,
            checkOut: null,
            totalHours: 0,
            notes: notes,
            isVirtual: true
          });
        }
      }
      
      attendance = attendance.map(r => ({
          ...r,
          _id: r.id,
          employee: r.employee ? {
              id: r.employee.id,
              mongoId: r.employee.mongoId,
              _id: r.employee.mongoId || r.employee.id,
              employeeId: r.employee.employeeId,
              personalDetails: {
                  firstName: r.employee.firstName,
                  lastName: r.employee.lastName,
                  email: r.employee.email
              },
              jobDetails: { organizationId: { name: r.employee.organization?.name } }
          } : null
      }));
      attendance = [...attendance, ...virtualRecords];
    } else {
        attendance = attendance.map(r => ({
            ...r,
            _id: r.id,
            employee: r.employee ? {
                id: r.employee.id,
                mongoId: r.employee.mongoId,
                _id: r.employee.mongoId || r.employee.id,
                employeeId: r.employee.employeeId,
                personalDetails: {
                    firstName: r.employee.firstName,
                    lastName: r.employee.lastName,
                    email: r.employee.email
                },
                jobDetails: { organizationId: { name: r.employee.organization?.name } }
            } : null
        }));
    }

    const shiftOrgIds = await resolveOrgIds(authUser.organizationId || (authUser.role === "super_admin" ? organizationId : null));
    const allOrgShifts = await prisma.workingShift.findMany({
      where: {
        organizationId: { in: shiftOrgIds }
      }
    });
    const rawDefaultShift = allOrgShifts.find(s => s.modelData?.isDefault === true) || allOrgShifts[0];
    const defaultShift = rawDefaultShift ? flattenModelData(rawDefaultShift) : null;

    // Prefetch all relevant shift rosters to prevent connection pool timeout/leak in Promise.all
    const employeeIds = attendance.map(rec => rec.employee?.id || rec.employeeId).filter(Boolean);
    let rosters = [];
    if (employeeIds.length > 0) {
      const rosterWhere = {
        employeeId: { in: employeeIds }
      };
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        rosterWhere.date = { gte: startOfDay, lte: endOfDay };
      } else if (startDate && endDate) {
        rosterWhere.date = { gte: new Date(startDate), lte: new Date(endDate) };
      } else if (startDate) {
        rosterWhere.date = { gte: new Date(startDate) };
      } else if (endDate) {
        rosterWhere.date = { lte: new Date(endDate) };
      }
      rosters = await prisma.shiftRoster.findMany({
        where: rosterWhere
      });
    }

    // Build O(1) roster lookup map
    const rosterMap = new Map();
    rosters.forEach(r => {
      if (r.employeeId && r.date) {
        const dateStr = new Date(r.date).toDateString();
        rosterMap.set(`${r.employeeId}_${dateStr}`, r);
      }
    });

    const shiftCache = new Map();

    attendance = await Promise.all(attendance.map(async (rec) => {
      if (rec.employee && rec.employee.id) {
        const recDate = new Date(rec.date);
        const dateStr = recDate.toDateString();
        const roster = rosterMap.get(`${rec.employee.id}_${dateStr}`);

        let shift = null;
        const rosterShiftId = roster?.shiftData?.shiftId;
        if (rosterShiftId) {
          shift = allOrgShifts.find(s => s.id === rosterShiftId || s.mongoId === rosterShiftId);
          if (!shift) {
            if (shiftCache.has(rosterShiftId)) {
              shift = shiftCache.get(rosterShiftId);
            } else {
              const fetchedShift = await prisma.workingShift.findFirst({ where: { OR: [{ id: rosterShiftId }, { mongoId: rosterShiftId }] } });
              if (fetchedShift) {
                shift = fetchedShift;
                shiftCache.set(rosterShiftId, fetchedShift);
              }
            }
          }
          if (shift) {
            shift = flattenModelData(shift);
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

        if (rec.checkIn && rec.status === 'Present') {
          const checkInTime = new Date(rec.checkIn);
          const [lateH, lateM] = lateCutoffStr.split(':').map(Number);
          const lateCutoffTime = new Date(checkInTime);
          lateCutoffTime.setHours(lateH, lateM, 0, 0);

          const [startH, startM] = shiftStartStr.split(':').map(Number);
          const shiftStartTime = new Date(checkInTime);
          shiftStartTime.setHours(startH, startM, 0, 0);

          if (checkInTime > lateCutoffTime) {
            const diffMs = checkInTime - shiftStartTime;
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

    let total = await prisma.attendance.count({ where: actualFilter });
    if (date && !isPastDate) total = attendance.length;

    return NextResponse.json({
      success: true,
      attendance,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const { employee, date, checkIn, checkOut, status, isProxy, proxyDetails, overtimeHours, notes, location, ipAddress, deviceId, attendanceMethod = 'Web' } = body;

    if (!employee || !date || !status) return NextResponse.json({ success: false, error: "Employee, date, and status are required" }, { status: 400 });

    const empRecordForAuth = await prisma.employee.findFirst({
        where: isValidUUID(employee)
            ? { OR: [{ id: employee }, { mongoId: employee }] }
            : { mongoId: employee },
        include: { organization: true }
    });
    
    if (!empRecordForAuth) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    
    if (authUser.role === "admin") {
      const authOrgIds = await resolveOrgIds(authUser.organizationId);
      if (!authOrgIds.includes(empRecordForAuth.organizationId)) {
        return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
      }
    } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee.toString() && authUser.mongoId !== employee.toString()) {
      return NextResponse.json({ success: false, error: "Forbidden: You can only log your own attendance" }, { status: 403 });
    }

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findFirst({
      where: { employeeId: empRecordForAuth.id, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (existingAttendance) return NextResponse.json({ success: false, error: "Attendance record already exists for this employee and date" }, { status: 400 });

    let isGeofenceVerified = false;
    let distanceFromOffice = null;
    let verificationFailureReason = null;
    let attendanceStatus = status;

    if (attendanceMethod === 'Mobile' || attendanceMethod === 'Web') {
      const assignedOfficeId = empRecordForAuth.assignedOfficeId;
      if (assignedOfficeId && location?.coordinates) {
        const office = await prisma.officeLocation.findFirst({
          where: isValidUUID(assignedOfficeId)
              ? { OR: [{ id: assignedOfficeId }, { mongoId: assignedOfficeId }] }
              : { mongoId: assignedOfficeId }
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

            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
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
    }

    let totalHours = 0;
    if (checkIn && checkOut) {
      const checkInTime = new Date(checkIn);
      const checkOutTime = new Date(checkOut);
      const diffMs = checkOutTime - checkInTime;
      totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const attendanceRecord = await prisma.attendance.create({
      data: {
        employeeId: empRecordForAuth.id,
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        totalHours,
        status: attendanceStatus,
        isProxy: isProxy || false,
        proxyDetails: isProxy ? proxyDetails : null,
        overtimeHours: overtimeHours || 0,
        notes,
        location: { type: 'Point', coordinates: location?.coordinates || [0, 0], accuracy: location?.accuracy },
        attendanceMethod,
        distanceFromOffice,
        isGeofenceVerified,
        verificationFailureReason,
        ipAddress,
        deviceId,
      },
      include: {
        employee: { select: { employeeId: true, firstName: true, lastName: true, email: true, organization: { select: { name: true } } } }
      }
    });

    checkAttendanceThresholds(attendanceDate).catch(error => {});

    return NextResponse.json({
      success: true,
      attendance: {
          ...attendanceRecord,
          _id: attendanceRecord.id,
          employee: {
              employeeId: attendanceRecord.employee.employeeId,
              personalDetails: {
                  firstName: attendanceRecord.employee.firstName,
                  lastName: attendanceRecord.employee.lastName,
                  email: attendanceRecord.employee.email
              },
              _id: empRecordForAuth.mongoId || empRecordForAuth.id,
              jobDetails: { organizationId: { name: attendanceRecord.employee.organization?.name } }
          }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const { employee, date, checkIn, checkOut, status, overtimeHours, notes, location } = body;

    let empRecordForAuth = null;
    if (employee) {
      empRecordForAuth = await prisma.employee.findFirst({
        where: isValidUUID(employee)
            ? { OR: [{ id: employee }, { mongoId: employee }] }
            : { mongoId: employee }
      });
      if (empRecordForAuth) {
        if (authUser.role === "admin") {
          const authOrgIds = await resolveOrgIds(authUser.organizationId);
          if (!authOrgIds.includes(empRecordForAuth.organizationId)) {
            return NextResponse.json({ success: false, error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
          }
        } else if ((authUser.role === "employee" || authUser.role === "attendance_only") && authUser.id !== employee.toString() && authUser.mongoId !== employee.toString()) {
          return NextResponse.json({ success: false, error: "Forbidden: You can only update your own attendance" }, { status: 403 });
        }
      }
    }

    if (!employee || !date) return NextResponse.json({ success: false, error: "Employee and date are required" }, { status: 400 });

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendance.findFirst({
      where: { employeeId: empRecordForAuth.id, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (!existingRecord) return NextResponse.json({ success: false, error: "Attendance record not found" }, { status: 404 });

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
      const diffMs = effectiveCheckOut - effectiveCheckIn;
      updateData.totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    const updated = await prisma.attendance.update({
      where: { id: existingRecord.id },
      data: updateData
    });

    return NextResponse.json({ success: true, attendance: { ...updated, _id: updated.id } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });

    const existingRecord = await prisma.attendance.findFirst({
        where: { OR: [{ id }, { mongoId: id }] },
        include: { employee: true }
    });

    if (!existingRecord) return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });

    if (authUser.role === "admin") {
      const authOrgIds = await resolveOrgIds(authUser.organizationId);
      if (!authOrgIds.includes(existingRecord.employee.organizationId)) {
        return NextResponse.json({ success: false, error: "Forbidden: Cannot delete attendance for another organization" }, { status: 403 });
      }
    }

    await prisma.attendance.delete({ where: { id: existingRecord.id } });
    return NextResponse.json({ success: true, message: "Attendance record deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import nodemailer from "nodemailer";
import { sendAttendanceThresholdNotification } from "@/utils/notifications";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendMismatchEmail(errors, failedCount, successCount, totalRecords) {
  if (errors.length === 0) return;

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .summary { background-color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .summary-item:last-child { border-bottom: none; }
        .error-list { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 20px; }
        .error-item { padding: 8px; margin: 5px 0; background-color: white; border-left: 4px solid #ef4444; border-radius: 4px; }
        .success-badge { color: #10b981; font-weight: bold; }
        .failed-badge { color: #ef4444; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin: 0;">⚠️ Attendance Import Mismatch Report</h2>
          <p style="margin: 5px 0 0 0;">Date: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
        </div>
        <div class="content">
          <div class="summary">
            <h3 style="margin-top: 0;">Import Summary</h3>
            <div class="summary-item"><span>Total Records Processed:</span><strong>${totalRecords}</strong></div>
            <div class="summary-item"><span>Successfully Imported:</span><strong class="success-badge">${successCount}</strong></div>
            <div class="summary-item"><span>Failed Records:</span><strong class="failed-badge">${failedCount}</strong></div>
            <div class="summary-item"><span>Success Rate:</span><strong>${((successCount / totalRecords) * 100).toFixed(1)}%</strong></div>
          </div>
          <div class="error-list">
            <h3 style="margin-top: 0; color: #ef4444;">❌ Error Details (${errors.length} issues)</h3>
            ${errors.map((error, index) => `
              <div class="error-item"><strong>#${index + 1}:</strong> ${error}</div>
            `).join('')}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from the Payroll Attendance System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "gaikwadsameer422@gmail.com",
    subject: `🚨 Attendance Import Alert: ${failedCount} Failed Records`,
    html: emailHTML,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Mismatch email sent successfully");
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
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

export async function POST(request) {
  try {
    const { attendanceRecords } = await request.json();
    console.log("Received Records:", attendanceRecords);

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return NextResponse.json({ error: "No attendance records received" }, { status: 400 });
    }

    let success = 0;
    let failed = 0;
    let errors = [];

    for (const record of attendanceRecords) {
      try {
        const {
          employeeCode,
          employeeName,
          date,
          status,
          checkIn,
          checkOut,
          workedHours,
          dayType,
        } = record;

        const employee = await prisma.employee.findFirst({
          where: { employeeId: employeeCode }
        });

        if (!employee) {
          failed++;
          errors.push(`Employee not found: ${employeeCode} (${employeeName || 'Unknown'})`);
          continue;
        }

        const allowedStatus = ["Present", "Absent", "Leave", "Weekend"];
        if (!allowedStatus.includes(status)) {
          failed++;
          errors.push(`Invalid status "${status}" for ${employeeCode} on ${date}`);
          continue;
        }

        const attendanceDate = new Date(date);
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await prisma.attendance.findFirst({
          where: {
            employeeId: employee.id,
            date: { gte: startOfDay, lte: endOfDay }
          }
        });

        if (existing) {
          failed++;
          errors.push(`Duplicate entry: ${employeeCode} (${employeeName || 'Unknown'}) already has attendance on ${attendanceDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}`);
          continue;
        }

        let totalHours = 0;
        let overtimeHours = 0;

        if (checkIn && checkOut) {
          const checkInTime = new Date(checkIn);
          const checkOutTime = new Date(checkOut);
          const diffMs = checkOutTime - checkInTime;
          totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

          if (employee.otApplicable === 'yes' && employee.workingHr) {
            const standardWorkingHours = employee.workingHr;
            if (totalHours > standardWorkingHours) {
              overtimeHours = parseFloat((totalHours - standardWorkingHours).toFixed(2));
            }
          }
        }

        await prisma.attendance.create({
          data: {
            employeeId: employee.id,
            date: attendanceDate,
            status,
            checkIn: checkIn ? new Date(checkIn) : null,
            checkOut: checkOut ? new Date(checkOut) : null,
            totalHours,
            overtimeHours,
            dayType: dayType || 'Full',
            workedHours: workedHours || 0,
          }
        });
        success++;

      } catch (err) {
        failed++;
        errors.push(`Error processing record: ${err.message}`);
      }
    }

    if (failed > 0) {
      await sendMismatchEmail(errors, failed, success, attendanceRecords.length);
    }

    if (success > 0) {
      const uniqueDates = [...new Set(attendanceRecords.map(record => record.date))];
      for (const dateStr of uniqueDates) {
        try {
          await checkAttendanceThresholds(new Date(dateStr));
        } catch (error) {
          console.error(`Error checking thresholds for date ${dateStr}:`, error);
        }
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors,
      message: `Import completed: ${success} successful, ${failed} failed${failed > 0 ? ' (Email sent with details)' : ''}`,
      emailSent: failed > 0,
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
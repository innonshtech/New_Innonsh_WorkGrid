// src/app/api/cron/attendance-report/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import nodemailer from "nodemailer";

// Configure nodemailer transporter
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

// Generate HTML email template
const generateEmailHTML = (reportData) => {
  const { date, summary, employeeTypeBreakdown, organizationBreakdown, totalEmployees } = reportData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .card h3 {
          margin: 0 0 10px 0;
          color: #667eea;
          font-size: 14px;
          text-transform: uppercase;
        }
        .card .value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }
        .card .label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .section {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section h2 {
          margin-top: 0;
          color: #667eea;
          font-size: 20px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background: #667eea;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        tr:hover {
          background: #f8f9fa;
        }
        .status-present {
          color: #28a745;
          font-weight: 600;
        }
        .status-absent {
          color: #dc3545;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
          font-size: 14px;
        }
        .percentage {
          font-size: 14px;
          color: #666;
          margin-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Daily Attendance Report</h1>
        <p>${new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div class="summary-cards">
        <div class="card">
          <h3>Total Employees</h3>
          <div class="value">${totalEmployees}</div>
          <div class="label">Active employees</div>
        </div>
        <div class="card">
          <h3>Present Today</h3>
          <div class="value" style="color: #28a745;">${summary.present}</div>
          <div class="label">${summary.presentPercentage}% attendance</div>
        </div>
        <div class="card">
          <h3>Absent Today</h3>
          <div class="value" style="color: #dc3545;">${summary.absent}</div>
          <div class="label">${summary.absentPercentage}% absenteeism</div>
        </div>
        <div class="card">
          <h3>On Leave</h3>
          <div class="value" style="color: #ffc107;">${summary.onLeave}</div>
          <div class="label">${summary.leavePercentage}% on leave</div>
        </div>
      </div>

      <div class="section">
        <h2>👥 Attendance by Employee Type</h2>
        <table>
          <thead>
            <tr>
              <th>Employee Type</th>
              <th>Present</th>
              <th>Absent</th>
              <th>On Leave</th>
              <th>Total</th>
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(employeeTypeBreakdown)
              .map(([type, data]) => {
                const attendanceRate = data.total > 0 
                  ? ((data.present / data.total) * 100).toFixed(1) 
                  : 0;
                return `
                  <tr>
                    <td><strong>${type}</strong></td>
                    <td class="status-present">${data.present}</td>
                    <td class="status-absent">${data.absent}</td>
                    <td style="color: #ffc107;">${data.onLeave}</td>
                    <td>${data.total}</td>
                    <td>
                      <span class="status-present">${attendanceRate}%</span>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      ${organizationBreakdown && Object.keys(organizationBreakdown).length > 0 ? `
        <div class="section">
          <h2>🏢 Attendance by Organization</h2>
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Present</th>
                <th>Absent</th>
                <th>On Leave</th>
                <th>Total</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(organizationBreakdown)
                .map(([org, data]) => {
                  const attendanceRate = data.total > 0 
                    ? ((data.present / data.total) * 100).toFixed(1) 
                    : 0;
                  return `
                    <tr>
                      <td><strong>${org}</strong></td>
                      <td class="status-present">${data.present}</td>
                      <td class="status-absent">${data.absent}</td>
                      <td style="color: #ffc107;">${data.onLeave}</td>
                      <td>${data.total}</td>
                      <td>
                        <span class="status-present">${attendanceRate}%</span>
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>This is an automated daily attendance report.</p>
        <p>Generated at ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })}</p>
      </div>
    </body>
    </html>
  `;
};

// Main function to generate and send report
async function generateAndSendReport() {
  try {
    // Get today's date (start and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("📅 Generating attendance report for:", today.toDateString());

    // Fetch all active employees
    const allEmployees = await prisma.employee.findMany({ 
      where: { 
        status: "Active" 
      },
      select: {
        id: true,
        employeeType: true,
        jobDetails: true,
      }
    });
    const totalEmployees = allEmployees.length;

    console.log("👥 Total active employees:", totalEmployees);

    // Fetch today's attendance records
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeType: true,
            jobDetails: true,
          }
        },
      },
    });

    console.log("✅ Attendance records found:", todayAttendance.length);

    // Initialize summary
    const summary = {
      present: 0,
      absent: 0,
      onLeave: 0,
      presentPercentage: 0,
      absentPercentage: 0,
      leavePercentage: 0,
    };

    // Initialize employee type breakdown
    const employeeTypeBreakdown = {};
    
    // Initialize organization breakdown
    const organizationBreakdown = {};

    // Create a map of employees who marked attendance
    const attendanceMap = new Map();
    todayAttendance.forEach((record) => {
      if (record.employee && record.employee.id) {
        attendanceMap.set(record.employee.id, record);
      }
    });

    // Process all employees
    allEmployees.forEach((employee) => {
      const employeeId = employee.id;
      const employeeType = employee.employeeType || "Unknown";
      
      let organization = "Unknown";
      if (employee.jobDetails) {
        const jobDetails = employee.jobDetails;
        if (typeof jobDetails === 'object' && jobDetails !== null) {
            if (jobDetails.organizationId && typeof jobDetails.organizationId === 'object' && jobDetails.organizationId.name) {
                organization = jobDetails.organizationId.name;
            } else if (jobDetails.organization) {
                organization = jobDetails.organization;
            }
        }
      }

      // Initialize employee type if not exists
      if (!employeeTypeBreakdown[employeeType]) {
        employeeTypeBreakdown[employeeType] = {
          present: 0,
          absent: 0,
          onLeave: 0,
          total: 0,
        };
      }

      // Initialize organization if not exists
      if (!organizationBreakdown[organization]) {
        organizationBreakdown[organization] = {
          present: 0,
          absent: 0,
          onLeave: 0,
          total: 0,
        };
      }

      // Increment total
      employeeTypeBreakdown[employeeType].total++;
      organizationBreakdown[organization].total++;

      // Check attendance status
      const attendanceRecord = attendanceMap.get(employeeId);
      
      if (attendanceRecord) {
        if (attendanceRecord.status === "Present") {
          summary.present++;
          employeeTypeBreakdown[employeeType].present++;
          organizationBreakdown[organization].present++;
        } else if (attendanceRecord.status === "On Leave") {
          summary.onLeave++;
          employeeTypeBreakdown[employeeType].onLeave++;
          organizationBreakdown[organization].onLeave++;
        } else {
          summary.absent++;
          employeeTypeBreakdown[employeeType].absent++;
          organizationBreakdown[organization].absent++;
        }
      } else {
        // No attendance record = Absent
        summary.absent++;
        employeeTypeBreakdown[employeeType].absent++;
        organizationBreakdown[organization].absent++;
      }
    });

    // Calculate percentages
    if (totalEmployees > 0) {
      summary.presentPercentage = ((summary.present / totalEmployees) * 100).toFixed(1);
      summary.absentPercentage = ((summary.absent / totalEmployees) * 100).toFixed(1);
      summary.leavePercentage = ((summary.onLeave / totalEmployees) * 100).toFixed(1);
    }

    console.log("📊 Summary:", summary);
    console.log("👔 Employee Type Breakdown:", employeeTypeBreakdown);
    console.log("🏢 Organization Breakdown:", organizationBreakdown);

    // Prepare report data
    const reportData = {
      date: today,
      summary,
      employeeTypeBreakdown,
      organizationBreakdown,
      totalEmployees,
    };

    // Generate HTML email
    const emailHTML = generateEmailHTML(reportData);

    // Send email
    const transporter = createTransporter();

    const recipientEmail = process.env.ATTENDANCE_REPORT_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"Payroll System" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Daily Attendance Report - ${today.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}`,
      html: emailHTML,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      reportData,
    };
  } catch (error) {
    console.error("❌ Error generating attendance report:", error);
    throw error;
  }
}

// POST - Manual trigger (for testing)
export async function POST(request) {
  try {
    console.log("🚀 Manual attendance report trigger");
    
    const result = await generateAndSendReport();

    return NextResponse.json({
      success: true,
      message: "Attendance report sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in POST /api/cron/attendance-report:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Scheduled cron job endpoint
export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("⏰ Scheduled attendance report trigger at", new Date().toISOString());

    const result = await generateAndSendReport();

    return NextResponse.json({
      success: true,
      message: "Attendance report sent successfully",
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error("Error in GET /api/cron/attendance-report:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

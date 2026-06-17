import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

/**
 * Pre-Payroll Validation API (Keka Standard)
 * Checks readiness of all employees before payroll can be processed.
 * Returns categorized issues that MUST be resolved before proceeding.
 */
export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get('month'));
        const year = parseInt(searchParams.get('year'));
        let orgId = searchParams.get('orgId');

        if (authUser.role === 'admin') {
            orgId = authUser.organizationId;
        }

        if (!orgId || orgId === "undefined" || orgId === "null") {
            const defaultOrg = await prisma.organization.findFirst({ where: {} });
            if (defaultOrg) orgId = defaultOrg.id;
        }

        if (!month || !year || !orgId) {
            return NextResponse.json({ error: "Missing month, year, or orgId" }, { status: 400 });
        }

        // Fetch all active employees
        const employees = await prisma.employee.findMany({ 
            where: {
                organizationId: orgId,
                status: 'Active'
            } 
        });

        const daysInMonth = new Date(year, month, 0).getDate();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const issues = {
            critical: [],   // Blocks payroll
            warnings: [],   // Should fix but can proceed
            info: []        // FYI
        };

        const analytics = {
            newJoiners: 0,
            missingCompliance: 0, // Counts critical issues
            estimatedFullBasic: 0,
            estimatedFullGross: 0,
            estimatedProratedGross: 0,
        };

        let readyCount = 0;

        for (const emp of employees) {
            const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeId;
            const empId = emp.id;
            let hasIssue = false;

            const struct = emp.payslipStructure && typeof emp.payslipStructure === 'object' ? emp.payslipStructure : {};

            // 1. Missing Salary Structure
            if (!struct.basicSalary) {
                issues.critical.push({
                    employeeId: emp.employeeId,
                    employeeName: empName,
                    type: 'MISSING_SALARY_STRUCTURE',
                    message: 'No salary structure assigned. Cannot calculate payroll.'
                });
                hasIssue = true;
            }

            // 2. Missing/Invalid Bank Details
            if (!emp.bankAccountNumber || !emp.ifscCode) {
                issues.critical.push({
                    employeeId: emp.employeeId,
                    employeeName: empName,
                    type: 'MISSING_BANK_DETAILS',
                    message: 'Incomplete bank details (Account No / IFSC missing). Cannot process payout.'
                });
                hasIssue = true;
            }

            // 3. Missing PAN for TDS-applicable employees
            if (emp.isTDSApplicable && (!emp.panNumber || emp.panNumber.length < 10)) {
                issues.warnings.push({
                    employeeId: emp.employeeId,
                    employeeName: empName,
                    type: 'MISSING_PAN',
                    message: 'PAN number missing but TDS is applicable. Higher TDS rate may apply.'
                });
                hasIssue = true;
            }

            // 4. Check Attendance coverage
            const attendanceCount = await prisma.attendance.count({ 
                where: {
                    employeeId: emp.id,
                    date: { gte: startDate, lte: endDate }
                } 
            });

            // Working days = total days minus typical Sundays (approximate)
            const expectedDays = Math.floor(daysInMonth * 5 / 7); // Rough working days
            if (attendanceCount < expectedDays * 0.5) {
                issues.warnings.push({
                    employeeId: emp.employeeId,
                    employeeName: empName,
                    type: 'LOW_ATTENDANCE_RECORDS',
                    message: `Only ${attendanceCount} attendance records found for the month. Expected ~${expectedDays}. Verify attendance data.`
                });
                hasIssue = true;
            }

            // 5. Mid-month joiner detection
            const joiningDate = emp.dateOfJoining ? new Date(emp.dateOfJoining) : null;
            if (joiningDate && joiningDate >= startDate && joiningDate <= endDate) {
                const joiningDay = joiningDate.getDate();
                const workingDays = daysInMonth - joiningDay + 1;
                issues.info.push({
                    employeeId: emp.employeeId,
                    employeeName: empName,
                    type: 'MID_MONTH_JOINER',
                    message: `Joined on ${joiningDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}. Salary will be prorated to ${workingDays}/${daysInMonth} days.`
                });
            }

            if (!hasIssue) readyCount++;
            
            // Accumulate estimates
            const fullBasic = (struct.basicSalary || 0);
            const fullGross = (struct.grossSalary || 0);
            analytics.estimatedFullBasic += fullBasic;
            analytics.estimatedFullGross += fullGross;

            // Pro-rated estimates for joiners (using already defined joiningDate)
            let proratedGross = fullGross;
            if (joiningDate && joiningDate >= startDate && joiningDate <= endDate) {
                const joiningDay = joiningDate.getDate();
                const workingDays = daysInMonth - joiningDay + 1;
                proratedGross = (fullGross / daysInMonth) * workingDays;
                analytics.newJoiners++;
            }
            analytics.estimatedProratedGross += proratedGross;

            // Compliance check (specifically critical issues)
            const hasCritical = issues.critical.some(i => i.employeeId === emp.employeeId);
            if (hasCritical) analytics.missingCompliance++;
        }

        const totalEmployees = employees.length;
        const isReady = issues.critical.length === 0;

        return NextResponse.json({
            isReady,
            summary: {
                totalEmployees,
                readyCount,
                criticalIssues: issues.critical.length,
                warnings: issues.warnings.length,
                infoNotices: issues.info.length,
                ...analytics
            },
            issues
        });

    } catch (error) {
        console.error("Validation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

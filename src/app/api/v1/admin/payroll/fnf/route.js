import prisma from '@/lib/db/prisma';
import {
    calculateGratuityAmount,
    calculateLeaveEncashment,
    calculateNoticeRecovery
} from "@/lib/utils/fnfCalculations";
import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();
        const { exitRequestId, action } = body;

        if (!exitRequestId) {
            return NextResponse.json({ error: "Exit Request ID is required" }, { status: 400 });
        }

        const exitRequest = await prisma.exitRequest.findFirst({
            where: isValidUUID(exitRequestId)
                ? { OR: [{ id: exitRequestId }, { mongoId: exitRequestId }] }
                : { mongoId: exitRequestId }
        });
        if (!exitRequest) {
            return NextResponse.json({ error: "Exit Request not found" }, { status: 404 });
        }

        const employeeId = exitRequest.employeeId || (exitRequest.exitData && exitRequest.exitData.employee);
        const employee = await prisma.employee.findFirst({
            where: isValidUUID(employeeId)
                ? { OR: [{ id: employeeId }, { mongoId: employeeId }] }
                : { mongoId: employeeId }
        });
        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // SaaS PROTECTION: Admin restricted to their org
        if (authUser.role === "admin") {
            const empOrgId = employee.organizationId;
            if (empOrgId !== authUser.organizationId) {
                return NextResponse.json({ error: "Forbidden: Not your organization" }, { status: 403 });
            }
        }

        // Check if FnF already exists using flat employeeId
        let fnfRecord = await prisma.fnFSettlement.findFirst({
            where: {
                employeeId: { in: [employee.id, employee.mongoId].filter(Boolean) }
            }
        });

        let fnfDataOut = fnfRecord ? { _id: fnfRecord.id, status: fnfRecord.status, ...fnfRecord.modelData } : null;

        if (action === "calculate" || !fnfRecord) {
            // --- CALCULATION LOGIC ---

            // 1. Basic Dates & Tenure
            const joiningDate = employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date();
            const lastWorkingDate = exitRequest.lastWorkingDate ? new Date(exitRequest.lastWorkingDate) : new Date();
            const tenureYears = (lastWorkingDate - joiningDate) / (1000 * 60 * 60 * 24 * 365.25);

            // 2. Salary Structure Snapshot
            const salaryStructure = employee.payslipStructure || {};
            const basicSalary = salaryStructure.basicSalary || 0;
            const grossSalary = salaryStructure.grossSalary || 0;

            // 3. Leave Balance (Fetch latest year record)
            const currentYear = lastWorkingDate.getFullYear();
            const leaveRecords = await prisma.leave.findMany({
                where: { OR: [{ employeeId: employee.id }, { employeeId: employee.mongoId }] }
            });
            const leaveRecord = leaveRecords.filter(l => l.year === currentYear).sort((a,b) => (b.month || 0) - (a.month || 0))[0];

            const leaveBalance = leaveRecord?.annualLeaveBalance?.remaining || 0;

            // Leave Encashment
            const leaveEncashmentAmount = calculateLeaveEncashment(leaveBalance, basicSalary);

            // Gratuity
            const gratuityAmount = employee.gratuityApplicable === 'yes' ? calculateGratuityAmount(basicSalary, tenureYears) : 0;

            const noticeShortfallDays = body.noticeShortfallDays || 0;
            const noticeRecoveryAmount = calculateNoticeRecovery(noticeShortfallDays, grossSalary);

            // Prorated Salary for Exit Month
            const exitMonth = lastWorkingDate.getMonth() + 1; // 1-12
            const daysInMonth = new Date(currentYear, exitMonth, 0).getDate();
            const daysWorked = body.daysWorked || lastWorkingDate.getDate(); // Default to date of exit

            const proratedSalary = Math.round((grossSalary / daysInMonth) * daysWorked);

            // Construct/Update FnF Object
            const fnfData = {
                employee: employee.id,
                exitRequest: exitRequest.id,
                resignationDate: exitRequest.resignationDate,
                lastWorkingDate: exitRequest.lastWorkingDate,
                salaryMonth: { month: exitMonth, year: currentYear },
                daysWorked,
                totalDaysInMonth: daysInMonth,
                salaryDetailsSnapshot: {
                    basicSalary,
                    grossSalary,
                    salaryType: salaryStructure.salaryType
                },
                earnings: {
                    totalEarnings: proratedSalary,
                    basic: Math.round((basicSalary / daysInMonth) * daysWorked)
                },
                leaveEncashment: {
                    eligibleDays: leaveBalance,
                    amount: leaveEncashmentAmount,
                    formula: "(Basic / 26) * Balance"
                },
                gratuity: {
                    isApplicable: employee.gratuityApplicable === 'yes',
                    tenureYears: parseFloat(tenureYears.toFixed(2)),
                    amount: gratuityAmount
                },
                noticePeriod: {
                    shortfallDays: noticeShortfallDays,
                    recoveryAmount: noticeRecoveryAmount
                },
                grossPayable: proratedSalary + leaveEncashmentAmount + gratuityAmount,
                totalRecoveries: noticeRecoveryAmount,
                netPayable: (proratedSalary + leaveEncashmentAmount + gratuityAmount) - noticeRecoveryAmount
            };

            if (fnfRecord) {
                fnfRecord = await prisma.fnFSettlement.update({
                    where: { id: fnfRecord.id },
                    data: {
                        modelData: { ...fnfRecord.modelData, ...fnfData }
                    }
                });
            } else {
                fnfRecord = await prisma.fnFSettlement.create({
                    data: {
                        employeeId: employee.id,
                        organizationId: employee.organizationId,
                        status: "Draft",
                        modelData: fnfData
                    }
                });
            }
            
            fnfDataOut = { _id: fnfRecord.id, status: fnfRecord.status, ...fnfRecord.modelData };
        }

        return NextResponse.json(fnfDataOut);

    } catch (error) {
        console.error("FnF Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const exitRequestId = searchParams.get("exitRequestId");
        const employeeId = searchParams.get("employeeId");

        if (!exitRequestId && !employeeId) {
            return NextResponse.json({ error: "Provide exitRequestId or employeeId" }, { status: 400 });
        }

        let where = {};
        if (exitRequestId) {
            const exitReq = await prisma.exitRequest.findFirst({
                where: isValidUUID(exitRequestId)
                    ? { OR: [{ id: exitRequestId }, { mongoId: exitRequestId }] }
                    : { mongoId: exitRequestId }
            });
            const empId = exitReq?.employeeId || (exitReq?.modelData && exitReq.modelData.employee);
            if (empId) {
                const emp = await prisma.employee.findFirst({
                    where: isValidUUID(empId)
                        ? { OR: [{ id: empId }, { mongoId: empId }] }
                        : { mongoId: empId }
                });
                if (emp) {
                    where.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
                }
            }
        } else if (employeeId) {
            const emp = await prisma.employee.findFirst({
                where: isValidUUID(employeeId)
                    ? { OR: [{ id: employeeId }, { mongoId: employeeId }] }
                    : { mongoId: employeeId }
            });
            if (emp) {
                where.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
            }
        }

        const fnfRecord = await prisma.fnFSettlement.findFirst({
            where
        });

        if (!fnfRecord) {
            return NextResponse.json(null);
        }

        let fnf = { _id: fnfRecord.id, status: fnfRecord.status, ...fnfRecord.modelData };

        if (fnf.employee) {
            const emp = await prisma.employee.findFirst({
                where: isValidUUID(fnf.employee)
                    ? { OR: [{ id: fnf.employee }, { mongoId: fnf.employee }] }
                    : { mongoId: fnf.employee }
            });
            if (emp) {
                fnf.employee = {
                    _id: emp.id,
                    personalDetails: {
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email,
                        phone: emp.phone
                    }
                };
            }
        }
        if (fnf.exitRequest) {
            const extReq = await prisma.exitRequest.findFirst({
                where: isValidUUID(fnf.exitRequest)
                    ? { OR: [{ id: fnf.exitRequest }, { mongoId: fnf.exitRequest }] }
                    : { mongoId: fnf.exitRequest }
            });
            if (extReq) fnf.exitRequest = { _id: extReq.id, status: extReq.status, ...extReq.modelData };
        }

        return NextResponse.json(fnf);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

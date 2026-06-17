import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateBankAdviceCSV } from '@/lib/utils/payout-generator';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const body = await request.json();
        const { payrollRunId, action } = body;

        let payrollRun = await prisma.payrollRun.findFirst({
            where: { OR: [{ id: payrollRunId }, { mongoId: payrollRunId }] }
        });
        if (!payrollRun) {
            return NextResponse.json({ error: 'Payroll Run not found' }, { status: 404 });
        }

        // SaaS PROTECTION: Admin can only process payroll in their org
        if (authUser.role === 'admin' && payrollRun.organizationId !== authUser.organizationId) {
            return NextResponse.json({ error: 'Forbidden: Not your organization' }, { status: 403 });
        }

        const runData = payrollRun.runData && typeof payrollRun.runData === 'object' ? payrollRun.runData : {};

        if (action === 'generate_advice') {
            // Fetch all payslips for this run
            const rawPayslips = await prisma.payslip.findMany({
                where: {
                    OR: [
                        { payrollRunId: payrollRun.id },
                        { payrollRunId: payrollRun.mongoId || undefined }
                    ]
                }
            });

            const payslips = await Promise.all(rawPayslips.map(async p => {
                const empId = p.employeeId;
                let emp = null;
                if (empId) {
                    const e = await prisma.employee.findFirst({
                        where: { OR: [{ id: empId }, { mongoId: empId }] }
                    });
                    if (e) {
                        emp = {
                            _id: e.id,
                            personalDetails: {
                                firstName: e.firstName,
                                lastName: e.lastName,
                                email: e.email,
                                phone: e.phone
                            },
                            salaryDetails: {
                                bankAccount: {
                                    accountNumber: e.bankAccountNumber,
                                    bankName: e.bankName,
                                    ifscCode: e.ifscCode,
                                    branch: e.branch
                                }
                            }
                        };
                    }
                }
                return {
                    month: p.month,
                    year: p.year,
                    netSalary: p.netSalary,
                    employee: emp
                };
            }));

            const csvContent = generateBankAdviceCSV(payslips);

            payrollRun = await prisma.payrollRun.update({
                where: { id: payrollRun.id },
                data: {
                    runData: {
                        ...runData,
                        payoutStatus: 'Processing'
                    }
                }
            });

            const runMonth = payrollRun.month || runData.month || 1;
            const runYear = payrollRun.year || runData.year || 2024;

            return NextResponse.json({
                message: 'Bank advice generated',
                csvContent,
                fileName: `Salary_Payout_${runMonth}_${runYear}.csv`
            });
        } else if (action === 'mark_paid') {
            // Update status
            payrollRun = await prisma.payrollRun.update({
                where: { id: payrollRun.id },
                data: {
                    runData: {
                        ...runData,
                        payoutStatus: 'Completed',
                        payoutDate: new Date().toISOString()
                    }
                }
            });

            // NOTIFICATION LOGIC
            const payslips = await prisma.payslip.findMany({
                where: {
                    OR: [
                        { payrollRunId: payrollRun.id },
                        { payrollRunId: payrollRun.mongoId || undefined }
                    ]
                }
            });

            const notifications = payslips.map(slip => {
                const netSal = slip.netSalary || 0;
                const runMonth = payrollRun.month || runData.month || 1;
                const runYear = payrollRun.year || runData.year || 2024;
                return {
                    organizationId: payrollRun.organizationId,
                    status: "Active",
                    modelData: {
                        type: 'salary-payout',
                        title: 'Salary Credited',
                        message: `Your salary for ${runMonth}/${runYear} has been processed. Net Payable: ₹${netSal.toFixed(2)}`,
                        priority: 'high',
                        employee: slip.employeeId,
                        read: false,
                        emailSent: false,
                        details: {
                            payrollRunId: payrollRun.id,
                            payslipId: slip.id,
                            amount: netSal,
                            month: runMonth,
                            year: runYear
                        }
                    }
                };
            });

            if (notifications.length > 0) {
                await prisma.notificationConfig.createMany({ data: notifications });
            }

            return NextResponse.json({ message: 'Payout marked as completed and notifications sent' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Payout API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

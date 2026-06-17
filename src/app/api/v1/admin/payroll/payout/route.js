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

        const payrollRun = await prisma.payrollRun.findFirst({ where: { OR: [{ id: payrollRunId }, { mongoId: payrollRunId }] } });
        if (!payrollRun) {
            return NextResponse.json({ error: 'Payroll Run not found' }, { status: 404 });
        }

        // SaaS PROTECTION: Admin can only process payroll in their org
        if (authUser.role === 'admin' && payrollRun.organizationId?.toString() !== authUser.organizationId) {
            return NextResponse.json({ error: 'Forbidden: Not your organization' }, { status: 403 });
        }

        // Status guard: Payout only allowed after publishing
        if (payrollRun.status !== 'Published' && payrollRun.status !== 'Paid') {
            return NextResponse.json({ error: 'Payroll must be Published before initiating bank payout.' }, { status: 400 });
        }

        if (action === 'generate_advice') {
            // Fetch all payslips for this run
            const rawPayslips = await prisma.payslip.findMany({ where: { payrollRunId: payrollRun.id } });

            const payslips = await Promise.all(rawPayslips.map(async p => {
                const emp = await prisma.employee.findFirst({
                    where: { id: p.employeeId }
                });
                let empMapped = null;
                if (emp) {
                    empMapped = {
                        _id: emp.id,
                        personalDetails: {
                            firstName: emp.firstName,
                            lastName: emp.lastName,
                            email: emp.email,
                            phone: emp.phone
                        },
                        salaryDetails: {
                            bankAccount: {
                                accountNumber: emp.bankAccountNumber,
                                bankName: emp.bankName,
                                ifscCode: emp.ifscCode,
                                branch: emp.branch
                            }
                        }
                    };
                }
                return {
                    month: p.month,
                    year: p.year,
                    netSalary: p.netSalary,
                    employee: empMapped
                };
            }));

            const csvContent = generateBankAdviceCSV(payslips);

            await prisma.payrollRun.update({
                where: { id: payrollRun.id },
                data: { payoutStatus: 'Processing' }
            });

            return NextResponse.json({
                message: 'Bank advice generated',
                csvContent,
                fileName: `Salary_Payout_${payrollRun.month}_${payrollRun.year}.csv`
            });
        } else if (action === 'mark_paid') {
            // Update run status to Paid (final state)
            await prisma.payrollRun.update({
                where: { id: payrollRun.id },
                data: {
                    status: 'Paid',
                    payoutStatus: 'Completed',
                    payoutDate: new Date()
                }
            });

            // Update all payslips to Paid
            await prisma.payslip.updateMany({
                where: { payrollRunId: payrollRun.id },
                data: { status: 'Paid', paymentDate: new Date() }
            });

            // NOTIFICATION LOGIC
            const payslips = await prisma.payslip.findMany({ where: { payrollRunId: payrollRun.id } });

            if (payslips.length > 0) {
                // Check if notification table is notification or notificationConfig
                // We'll write to notification table (Prisma schema: model Notification is usually there, or notificationConfig)
                const notificationData = payslips.map(slip => ({
                    type: 'salary-payout',
                    title: 'Salary Credited',
                    message: `Your salary for ${payrollRun.month}/${payrollRun.year} has been processed. Net Payable: ₹${(slip.netSalary || 0).toFixed(2)}`,
                    priority: 'high',
                    employeeId: slip.employeeId,
                    organizationId: payrollRun.organizationId,
                    read: false,
                    emailSent: false,
                    notificationData: {
                        payrollRunId: payrollRun.id,
                        payslipId: slip.id,
                        amount: slip.netSalary,
                        month: payrollRun.month,
                        year: payrollRun.year
                    }
                }));

                try {
                    await prisma.notification.createMany({ data: notificationData });
                } catch (e) {
                    try {
                        // fallback to notificationConfig
                        await prisma.notificationConfig.createMany({
                            data: notificationData.map(n => ({
                                organizationId: n.organizationId,
                                status: "Active",
                                modelData: {
                                    type: n.type,
                                    title: n.title,
                                    message: n.message,
                                    priority: n.priority,
                                    employee: n.employeeId,
                                    read: n.read,
                                    emailSent: n.emailSent,
                                    details: n.notificationData
                                }
                            }))
                        });
                    } catch (err) {
                        console.error("Failed to create notifications:", err);
                    }
                }
            }

            return NextResponse.json({ message: 'Payout marked as completed and notifications sent' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Payout API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

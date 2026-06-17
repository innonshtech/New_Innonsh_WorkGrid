import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
    try {
        // 1. Create Karnataka Config
        await prisma.statutoryConfig.deleteMany({
            where: { state: 'Karnataka-Test' }
        });

        const karnatakaConfig = await prisma.statutoryConfig.create({
            data: {
                state: 'Karnataka-Test',
                ptApplicable: true,
                ptSlabs: [
                    { minSalary: 0, maxSalary: 15000, taxAmount: 0 },
                    { minSalary: 15001, maxSalary: 1000000, taxAmount: 200 }
                ]
            }
        });

        // 2. Create/Find User
        let user = await prisma.user.findFirst({
            where: { email: 'admin@test.com' }
        });
        if (!user) {
            user = await prisma.user.findFirst({});
        }

        // 3. Create Employee
        const email = `test-karnataka-v2-${Date.now()}@example.com`;

        const empData = {
            employeeId: `EMP-V2-${Date.now()}`,
            workingHr: 9,
            personalDetails: {
                firstName: 'Karnataka',
                lastName: 'Tester',
                email: email,
                phone: '9999999999',
                dateOfBirth: new Date('1990-01-01'),
                dateOfJoining: new Date(),
                currentAddress: {
                    street: 'Test St', city: 'Bangalore', state: 'Karnataka', zipCode: '560001'
                },
                permanentAddress: {
                    street: 'Test St', city: 'Bangalore', state: 'Karnataka', zipCode: '560001'
                }
            },
            jobDetails: {
                designation: 'Software Engineer',
                workState: 'Karnataka-Test',
                department: 'Engineering',
            },
            salaryDetails: {
                bankAccount: { accountNumber: '1234567890', bankName: 'Test Bank', ifscCode: 'TEST0000001' }
            },
            payslipStructure: {
                salaryType: 'monthly',
                basicSalary: 20000,
                earnings: [],
                deductions: [],
            },
            password: 'password123',
            createdBy: user ? user.id : undefined // Using user.id for Prisma
        };

        // Replicate the pre-save hook logic for PT calculation
        let professionalTaxAmount = 0;
        if (karnatakaConfig && karnatakaConfig.ptApplicable) {
            const basicSalary = empData.payslipStructure.basicSalary;
            // Assuming ptSlabs is stored as a JSON array in Prisma
            const ptSlabs = karnatakaConfig.ptSlabs;

            if (Array.isArray(ptSlabs)) {
                for (const slab of ptSlabs) {
                    // Assuming slab properties (minSalary, maxSalary, taxAmount) are directly accessible from JSON objects
                    if (basicSalary >= slab.minSalary && basicSalary <= slab.maxSalary) {
                        professionalTaxAmount = slab.taxAmount;
                        break;
                    }
                }
            }
        }

        if (professionalTaxAmount > 0) {
            empData.payslipStructure.deductions.push({
                name: 'Professional Tax (PT)',
                type: 'STATUTORY',
                calculatedAmount: professionalTaxAmount,
            });
        }

        const employee = await prisma.employee.create({
            data: empData
        });

        // 4. Verify
        // Access payslipStructure directly from the created Prisma employee object
        const ptDeduction = employee.payslipStructure.deductions.find(d => d.name === 'Professional Tax (PT)');
        let result = {};

        if (ptDeduction && ptDeduction.calculatedAmount === 200) {
            result = {
                status: 'SUCCESS',
                message: 'Karnataka PT calculated correctly (200)',
                pt: ptDeduction.calculatedAmount
            };
        } else {
            result = {
                status: 'FAILURE',
                message: `Expected 200, got ${ptDeduction ? ptDeduction.calculatedAmount : 'None'}`,
                pt: ptDeduction
            };
        }

        // Cleanup
        await prisma.statutoryConfig.deleteMany({
            where: { state: 'Karnataka-Test' }
        });
        await prisma.employee.delete({
            where: {
                OR: [
                    { id: employee.id }, // Prisma's primary ID
                    { mongoId: employee.id } // For legacy MongoDB IDs, if applicable
                ]
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        // Ensure error is of type Error for message and stack properties
        const err = error instanceof Error ? error : new Error(String(error));
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 200 });
    }
}
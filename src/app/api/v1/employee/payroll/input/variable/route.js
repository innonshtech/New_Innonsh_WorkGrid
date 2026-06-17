import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';





export async function GET(req) {
    try {
        
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get('runId');

        if (!runId) {
            return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
        }

        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: runId }, { mongoId: runId }] } });

        if (!run) {
            return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 });
        }

        // Fetch all active employees associated with the run's organization
        const rawEmployees = await prisma.employee.findMany({
            where: {
                organizationId: run.organizationId,
                status: 'Active'
            },
            select: {
                id: true,
                mongoId: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                variablePayStructure: true
            }
        });

        // Filter employees who have variable pay assigned
        const employees = rawEmployees.filter(emp => 
            emp.variablePayStructure && 
            Array.isArray(emp.variablePayStructure) && 
            emp.variablePayStructure.length > 0
        );

        // Fetch existing inputs for this run
        const rawInputs = await prisma.payrollVariableInput.findMany({
            where: {
                organizationId: run.organizationId
            }
        });
        const inputs = rawInputs
            .map(item => ({
                id: item.id,
                employeeId: item.employeeId,
                ...item.modelData
            }))
            .filter(item => item.payrollRunId === runId);

        const inputMap = {};
        inputs.forEach(input => {
            const empId = (input.employeeId || '').toString();
            const compId = (input.componentId || '').toString();
            if (empId && compId) {
                if (!inputMap[empId]) inputMap[empId] = {};
                inputMap[empId][compId] = input;
            }
        });

        // Fetch all variable pay components to get names
        const rawComponents = await prisma.variablePayConfig.findMany({
            where: { organizationId: run.organizationId }
        });
        const components = rawComponents.map(c => ({
            id: c.id,
            mongoId: c.mongoId,
            ...c.modelData
        }));

        const componentMap = {};
        components.forEach(c => {
            componentMap[c.id] = c;
            if (c.mongoId) componentMap[c.mongoId] = c;
        });

        const data = employees.map(emp => {
            const structure = (emp.variablePayStructure || []).map(item => {
                const component = componentMap[item.componentId];
                const existingInput = inputMap[emp.id]?.[item.componentId] || inputMap[emp.mongoId]?.[item.componentId];

                return {
                    componentId: item.componentId,
                    componentName: component?.name || 'Unknown',
                    targetAmount: item.targetAmount,
                    frequency: item.frequency,
                    achievementPercentage: existingInput ? existingInput.achievementPercentage : 100, // Default to 100%
                    payoutAmount: existingInput ? existingInput.payoutAmount : item.targetAmount // Default to target
                };
            });

            return {
                employeeId: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                code: emp.employeeId,
                structure
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching variable pay inputs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { runId, inputs } = body;

        if (!runId || !Array.isArray(inputs)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: runId }, { mongoId: runId }] } });
        if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

        // Upsert operations sequentially
        for (const input of inputs) {
            const rawExisting = await prisma.payrollVariableInput.findMany({
                where: {
                    employeeId: input.employeeId,
                    organizationId: run.organizationId
                }
            });
            const existing = rawExisting.find(item => item.modelData?.componentId === input.componentId && item.modelData?.payrollRunId === runId);

            const modelData = {
                payrollRunId: runId,
                componentId: input.componentId,
                achievementPercentage: input.achievementPercentage,
                payoutAmount: input.payoutAmount,
                month: run.month,
                year: run.year
            };

            if (existing) {
                await prisma.payrollVariableInput.update({
                    where: { id: existing.id },
                    data: {
                        modelData: {
                            ...existing.modelData,
                            ...modelData
                        }
                    }
                });
            } else {
                await prisma.payrollVariableInput.create({
                    data: {
                        employeeId: input.employeeId,
                        organizationId: run.organizationId,
                        status: "Active",
                        modelData
                    }
                });
            }
        }

        return NextResponse.json({ message: 'Variable pay inputs saved successfully' });
    } catch (error) {
        console.error("Error saving variable pay inputs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

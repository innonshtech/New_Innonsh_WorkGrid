import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

// GET: Fetch all configs or a specific state's config
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');

        const configs = await prisma.statutoryConfig.findMany();
        
        let filteredConfigs = configs.map(c => ({
            id: c.id,
            mongoId: c.mongoId,
            organizationId: c.organizationId,
            employeeId: c.employeeId,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            ...(c.modelData || {})
        }));

        if (state) {
            const stateLower = state.toLowerCase();
            filteredConfigs = filteredConfigs.filter(c => c.state && c.state.toLowerCase().includes(stateLower));
        }

        return NextResponse.json(filteredConfigs);
    } catch (error) {
        console.error('Error fetching statutory configs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create or Update a config
export async function POST(request) {
    try {
        const body = await request.json();
        const { state, ptSlabs, lwfRules, isEnabled, ptApplicable, lwfApplicable } = body;

        if (!state) {
            return NextResponse.json({ error: 'State is required' }, { status: 400 });
        }

        // Find existing configuration
        const configs = await prisma.statutoryConfig.findMany();
        const stateLower = state.toLowerCase();
        const existingConfig = configs.find(c => c.modelData && c.modelData.state && c.modelData.state.toLowerCase() === stateLower);

        let config;
        if (existingConfig) {
            const currentData = existingConfig.modelData || {};
            const updatedModelData = {
                ...currentData,
                ptSlabs: ptSlabs !== undefined ? ptSlabs : currentData.ptSlabs,
                lwfRules: lwfRules !== undefined ? lwfRules : currentData.lwfRules,
                isEnabled: isEnabled !== undefined ? isEnabled : currentData.isEnabled,
                ptApplicable: ptApplicable !== undefined ? ptApplicable : currentData.ptApplicable,
                lwfApplicable: lwfApplicable !== undefined ? lwfApplicable : currentData.lwfApplicable,
                state: currentData.state || state
            };

            config = await prisma.statutoryConfig.update({
                where: { id: existingConfig.id },
                data: {
                    modelData: updatedModelData
                }
            });
        } else {
            const newModelData = {
                state,
                ptSlabs: ptSlabs || [],
                lwfRules: lwfRules || {},
                isEnabled: isEnabled !== undefined ? isEnabled : true,
                ptApplicable: ptApplicable !== undefined ? ptApplicable : true,
                lwfApplicable: lwfApplicable !== undefined ? lwfApplicable : false
            };

            config = await prisma.statutoryConfig.create({
                data: {
                    status: 'Active',
                    modelData: newModelData
                }
            });
        }

        const result = {
            id: config.id,
            mongoId: config.mongoId,
            organizationId: config.organizationId,
            employeeId: config.employeeId,
            status: config.status,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            ...(config.modelData || {})
        };

        return NextResponse.json({ message: 'Configuration saved successfully', config: result });
    } catch (error) {
        console.error('Error saving statutory config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

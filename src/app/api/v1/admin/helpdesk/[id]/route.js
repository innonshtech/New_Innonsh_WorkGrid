import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const ticket = await prisma.helpdeskTicket.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });

        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        let assignedToData = null;
        if (ticket.assignedTo) {
            const userObj = await prisma.user.findFirst({
                where: { OR: [{ id: ticket.assignedTo }, { mongoId: ticket.assignedTo }] }
            });
            if (userObj) {
                assignedToData = { _id: userObj.id, name: userObj.name };
            } else {
                const empObj = await prisma.employee.findFirst({
                    where: { OR: [{ id: ticket.assignedTo }, { mongoId: ticket.assignedTo }] }
                });
                if (empObj) {
                    const personalDetails = empObj.modelData?.personalDetails || empObj.personalDetails || {};
                    assignedToData = { 
                        _id: empObj.id, 
                        name: `${personalDetails.firstName || ""} ${personalDetails.lastName || ""}`.trim() || "Unknown Employee"
                    };
                }
            }
        }

        const ticketJson = {
            _id: ticket.id,
            id: ticket.id,
            employeeId: ticket.employeeId,
            subject: ticket.subject,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            description: ticket.description,
            comments: ticket.comments || [],
            assignedTo: assignedToData || ticket.assignedTo,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt
        };

        return NextResponse.json(ticketJson);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const ticket = await prisma.helpdeskTicket.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });
        if (!ticket) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        const currentComments = Array.isArray(ticket.comments) ? ticket.comments : [];
        let updatedComments = [...currentComments];

        // Handle Comment Addition
        if (body.newComment) {
            updatedComments.push({
                user: body.newComment.userId,
                userName: body.newComment.userName,
                message: body.newComment.message,
                date: new Date().toISOString(),
            });
        }

        const updateData = {
            comments: updatedComments
        };

        // Handle Status/Priority/Assignment Updates
        if (body.status) updateData.status = body.status;
        if (body.priority) updateData.priority = body.priority;
        if (body.assignedTo) updateData.assignedTo = body.assignedTo;

        const updatedTicket = await prisma.helpdeskTicket.update({
            where: { id: ticket.id },
            data: updateData
        });

        const ticketJson = {
            _id: updatedTicket.id,
            id: updatedTicket.id,
            employeeId: updatedTicket.employeeId,
            subject: updatedTicket.subject,
            category: updatedTicket.category,
            priority: updatedTicket.priority,
            status: updatedTicket.status,
            description: updatedTicket.description,
            comments: updatedTicket.comments || [],
            assignedTo: updatedTicket.assignedTo,
            createdAt: updatedTicket.createdAt,
            updatedAt: updatedTicket.updatedAt
        };

        return NextResponse.json(ticketJson);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

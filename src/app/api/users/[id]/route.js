import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request, { params }) {
    try {
        const { id } = params;

        // Validate ID format (still relevant for potential legacy MongoDB IDs)
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ error: 'Invalid User ID format' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { mongoId: id } // Assuming 'mongoId' field exists in your Prisma User model for legacy IDs
                ],
            },
            select: {
                id: true,
                mongoId: true, // Include if you want the legacy ID in the response
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                // Add any other scalar fields from your Prisma User model that you wish to include.
                // For instance, if you have 'bio', 'profilePictureUrl', etc.:
                // bio: true,
                // profilePictureUrl: true,
                password: false, // Explicitly exclude the password field
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
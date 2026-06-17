import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function POST(req, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

        
        const { id } = await params;
        const { text } = await req.json();

        const post = await prisma.shoutOut.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        const shoutOutData = post.shoutOutData || {};
        const comments = shoutOutData.comments || [];

        comments.push({
            author: authUser.id,
            text: text,
            createdAt: new Date().toISOString()
        });
        
        shoutOutData.comments = comments;

        const updatedPost = await prisma.shoutOut.update({
            where: { id: post.id },
            data: { shoutOutData }
        });

        return NextResponse.json({ success: true, post: updatedPost });
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

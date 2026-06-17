import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function POST(req, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

        
        const { id } = await params;

        const post = await prisma.shoutOut.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!post) return NextResponse.json({ message: 'Post not found' }, { status: 404 });

        const shoutOutData = post.shoutOutData || {};
        const likes = shoutOutData.likes || [];

        const likedIndex = likes.indexOf(authUser.id);
        if (likedIndex > -1) {
            // Unlike
            likes.splice(likedIndex, 1);
        } else {
            // Like
            likes.push(authUser.id);
        }

        shoutOutData.likes = likes;

        await prisma.shoutOut.update({
            where: { id: post.id },
            data: { shoutOutData }
        });

        return NextResponse.json({ success: true, likesCount: likes.length });
    } catch (error) {
        console.error('Like error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

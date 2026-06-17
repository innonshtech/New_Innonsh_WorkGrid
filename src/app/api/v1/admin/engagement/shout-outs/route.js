import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/service';
import { getShoutOutTemplate } from '@/lib/email/templates/index';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);
        
        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        // Fetch posts
        const allPosts = await prisma.shoutOut.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Fetch all active employees under organization to map author & recipient sub-profiles in-memory
        const employees = await prisma.employee.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });
        const employeeMap = {};
        const employeeMongoMap = {};
        const allowedEmpIds = new Set();
        employees.forEach(emp => {
            employeeMap[emp.id] = emp;
            allowedEmpIds.add(emp.id);
            if (emp.mongoId) {
                employeeMongoMap[emp.mongoId] = emp;
                allowedEmpIds.add(emp.mongoId);
            }
        });

        const mappedPosts = allPosts.map(post => {
            const postData = post.shoutOutData && typeof post.shoutOutData === 'object' ? post.shoutOutData : {};
            
            // Map Author details
            const authorId = post.fromEmployeeId || postData.author;
            const authorEmp = employeeMap[authorId] || employeeMongoMap[authorId] || null;
            const authorInfo = authorEmp ? {
                _id: authorEmp.id,
                id: authorEmp.id,
                employeeId: authorEmp.employeeId,
                personalDetails: {
                    firstName: authorEmp.firstName,
                    lastName: authorEmp.lastName,
                    email: authorEmp.email
                }
            } : null;

            // Map ShoutoutTo recipient details
            const recipientId = post.toEmployeeId || postData.shoutoutTo;
            const recipientEmp = employeeMap[recipientId] || employeeMongoMap[recipientId] || null;
            const shoutoutToInfo = recipientEmp ? {
                _id: recipientEmp.id,
                id: recipientEmp.id,
                employeeId: recipientEmp.employeeId,
                personalDetails: {
                    firstName: recipientEmp.firstName,
                    lastName: recipientEmp.lastName,
                    email: recipientEmp.email
                }
            } : null;

            // Map Comment Authors
            const commentsList = postData.comments || [];
            const mappedComments = commentsList.map(comment => {
                const cAuthorId = comment.author;
                const cEmp = employeeMap[cAuthorId] || employeeMongoMap[cAuthorId] || null;
                return {
                    ...comment,
                    author: cEmp ? {
                        _id: cEmp.id,
                        id: cEmp.id,
                        personalDetails: {
                            firstName: cEmp.firstName,
                            lastName: cEmp.lastName
                        }
                    } : null
                };
            });

            return {
                _id: post.id,
                id: post.id,
                mongoId: post.mongoId,
                message: post.message,
                content: post.message, // Map message to content for frontend consistency
                ...postData,
                author: authorInfo,
                shoutoutTo: shoutoutToInfo,
                comments: mappedComments,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            };
        });

        // Filter posts to enforce tenant isolation in-memory
        const filteredPosts = mappedPosts.filter(post => {
            const matchesAuthor = post.author && allowedEmpIds.has(post.author.id);
            const matchesRecipient = post.shoutoutTo && allowedEmpIds.has(post.shoutoutTo.id);
            const matchesOrg = post.organizationId === (org ? org.id : authUser.organizationId) || post.organizationId === (org ? org.mongoId : null);
            return matchesAuthor || matchesRecipient || matchesOrg;
        });

        return NextResponse.json({ success: true, posts: filteredPosts });
    } catch (error) {
        console.error('Fetch shoutouts error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

        const body = await req.json();

        // Resolve organization
        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;

        // Resolve recipient employee if shoutoutTo exists
        let resolvedToEmployeeId = body.shoutoutTo || null;
        if (body.shoutoutTo) {
            const recipient = await prisma.employee.findFirst({
                where: { OR: [{ id: body.shoutoutTo }, { mongoId: body.shoutoutTo }] }
            });
            if (recipient) {
                resolvedToEmployeeId = recipient.id;
            }
        }

        // Map creator to employeeId
        let resolvedFromEmployeeId = authUser.id;
        const authorEmp = await prisma.employee.findFirst({
            where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
        });
        if (authorEmp) {
            resolvedFromEmployeeId = authorEmp.id;
        }

        const isAnnouncement = body.type === 'announcement';
        const announcementByAdmin = ["admin", "hr", "company_admin", "super_admin"].includes(authUser.role) && isAnnouncement;

        const shoutOutData = {
            type: body.type || 'shoutout',
            likes: [],
            comments: [],
            visibility: body.visibility || 'public',
            attachments: body.attachments || [],
            announcementByAdmin,
            organizationId: org ? org.id : authUser.organizationId
        };

        const post = await prisma.shoutOut.create({
            data: {
                fromEmployeeId: resolvedFromEmployeeId,
                toEmployeeId: resolvedToEmployeeId,
                message: body.content || body.message || 'what is in your mind',
                shoutOutData
            }
        });

        // Trigger email notification for Shout-Outs
        if (body.type === 'shoutout' && resolvedToEmployeeId) {
            const dashboardUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;
            const [recipient, authorUser] = await Promise.all([
                prisma.employee.findFirst({ where: { id: resolvedToEmployeeId } }),
                prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } })
            ]);

            if (recipient?.email) {
                let authorName = "A colleague";
                if (authorEmp) {
                    authorName = `${authorEmp.firstName} ${authorEmp.lastName}`;
                } else if (authorUser) {
                    authorName = authorUser.name;
                }

                const emailHtml = getShoutOutTemplate(authorName, post.message, dashboardUrl);

                await sendEmail({
                    to: recipient.email,
                    subject: `You received a Shout-Out from ${authorName}!`,
                    html: emailHtml
                });
            }
        }

        const formatted = {
            _id: post.id,
            id: post.id,
            mongoId: post.mongoId,
            message: post.message,
            content: post.message,
            ...shoutOutData,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        };

        return NextResponse.json({ success: true, post: formatted }, { status: 201 });
    } catch (error) {
        console.error('Create shoutout error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}

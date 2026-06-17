import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { searchParams } = new URL(request.url);
        const candidateId = searchParams.get('candidateId');

        let query = {};
        
        // SaaS PROTECTION
        let orgQueryVal = undefined;
        const orgId = authUser.role === 'admin' ? authUser.organizationId : searchParams.get('organizationId');
        if (orgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: orgId }, { mongoId: orgId }] }
            });
            if (org) {
                orgQueryVal = { in: [org.id, org.mongoId].filter(Boolean) };
            } else {
                orgQueryVal = orgId;
            }
        }

        if (candidateId) query.candidateId = candidateId;

        let offersRecords = await prisma.offerLetter.findMany({ where: query });

        // Filter by organizationId in-memory to support JSON-based tenant scoping safely
        if (orgId) {
            const allowedOrgIds = orgQueryVal && typeof orgQueryVal === 'object' && orgQueryVal.in 
                ? orgQueryVal.in 
                : [orgId];
            offersRecords = offersRecords.filter(o => {
                const data = (o.offerData && typeof o.offerData === 'object') ? o.offerData : {};
                return allowedOrgIds.includes(data.organizationId);
            });
        }

        // Fetch candidates to populate candidate details
        let candidatesRecords = await prisma.candidate.findMany();
        if (orgId) {
            const allowedOrgIds = orgQueryVal && typeof orgQueryVal === 'object' && orgQueryVal.in 
                ? orgQueryVal.in 
                : [orgId];
            candidatesRecords = candidatesRecords.filter(c => {
                const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
                return allowedOrgIds.includes(data.organizationId);
            });
        }

        const candidatesMap = {};
        candidatesRecords.forEach(c => {
            const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
            let cName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
            if ((!cName || cName === 'Unknown Unknown' || cName === 'Unknown') && data.name) {
                cName = data.name;
            }
            candidatesMap[c.id] = {
                id: c.id,
                _id: c.id,
                name: cName,
                email: c.email
            };
        });

        const offers = offersRecords.map(o => {
            const offerDataObj = (o.offerData && typeof o.offerData === 'object') ? o.offerData : {};
            const candidate = o.candidateId ? candidatesMap[o.candidateId] : null;
            return {
                ...o,
                ...offerDataObj,
                id: o.id,
                _id: o.id,
                candidate
            };
        });

        return NextResponse.json({ success: true, offers });
    } catch (error) {
        console.error("GET OFFERS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const orgId = authUser.role !== 'super_admin' ? authUser.organizationId : body.organizationId;
        
        const { candidate, ...rest } = body;

        const offer = await prisma.offerLetter.create({ 
            data: { 
                candidateId: candidate,
                status: 'Pending Internal Approval',
                offerData: {
                    ...rest,
                    organizationId: orgId,
                    approvalChain: [
                        { role: 'HR Admin', status: 'Pending' },
                        { role: 'Finance', status: 'Pending' }
                    ],
                    sentBy: authUser.id 
                }
            } 
        });

        const offerDataObj = (offer.offerData && typeof offer.offerData === 'object') ? offer.offerData : {};
        const formatted = {
            ...offer,
            ...offerDataObj,
            id: offer.id,
            _id: offer.id
        };

        return NextResponse.json({ success: true, offer: formatted, message: "Offer letter generated successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST OFFER ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const { id, approvalRole, approvalStatus, remarks, ...updateData } = body;

        const offer = await prisma.offerLetter.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!offer) return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });

        let currentOfferData = offer.offerData ? (typeof offer.offerData === 'string' ? JSON.parse(offer.offerData) : offer.offerData) : {};
        let newApprovalChain = [...(currentOfferData.approvalChain || [])];
        let newStatus = offer.status;

        let updateDataObj = {};

        if (approvalRole && approvalStatus) {
            const levelIndex = newApprovalChain.findIndex(c => c.role === approvalRole);
            if (levelIndex > -1) {
                newApprovalChain[levelIndex].status = approvalStatus;
                newApprovalChain[levelIndex].approvedBy = authUser.id;
                newApprovalChain[levelIndex].approvedAt = new Date();
                newApprovalChain[levelIndex].remarks = remarks || '';
                
                const allApproved = newApprovalChain.every(c => c.status === 'Approved');
                const anyRejected = newApprovalChain.some(c => c.status === 'Rejected');
                
                if (anyRejected) {
                    newStatus = 'Rejected';
                } else if (allApproved) {
                    newStatus = 'Approved';
                }
            }
            currentOfferData.approvalChain = newApprovalChain;
            updateDataObj.offerData = currentOfferData;
            updateDataObj.status = newStatus;
        } else {
            // Edit mode: merge incoming updateData fields into offerData
            Object.keys(updateData).forEach(key => {
                if (key === 'status') {
                    updateDataObj.status = updateData[key];
                } else if (key === 'candidateId' || key === 'candidate') {
                    updateDataObj.candidateId = updateData[key];
                } else {
                    currentOfferData[key] = updateData[key];
                }
            });
            updateDataObj.offerData = currentOfferData;
        }

        const updatedOffer = await prisma.offerLetter.update({
            where: { id: offer.id },
            data: updateDataObj
        });

        const offerDataObj = (updatedOffer.offerData && typeof updatedOffer.offerData === 'object') ? updatedOffer.offerData : {};
        const formatted = {
            ...updatedOffer,
            ...offerDataObj,
            id: updatedOffer.id,
            _id: updatedOffer.id
        };

        if (approvalRole && approvalStatus) {
            return NextResponse.json({ success: true, offer: formatted, message: "Approval status updated" });
        }

        return NextResponse.json({ success: true, offer: formatted, message: "Offer updated successfully" });
    } catch (error) {
        console.error("PUT OFFER ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

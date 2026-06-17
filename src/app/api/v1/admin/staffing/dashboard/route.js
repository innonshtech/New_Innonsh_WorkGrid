import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';







import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    
    // 1. Fetch base records from DB safely using root columns
    const [
      clients,
      requirements,
      candidates,
      submissions,
      employees,
      users
    ] = await Promise.all([
      prisma.staffingClient.findMany({ where: { organizationId: authUser.organizationId } }),
      prisma.staffingRequirement.findMany(), // organizationId is not a column, filter by client below
      prisma.staffingCandidate.findMany({ where: { organizationId: authUser.organizationId } }),
      prisma.staffingSubmission.findMany({ where: { organizationId: authUser.organizationId } }),
      prisma.employee.findMany({
        where: { role: "recruiter", organizationId: authUser.organizationId },
        select: { id: true, mongoId: true, firstName: true, lastName: true, email: true, designation: true }
      }),
      prisma.user.findMany({
        where: { role: "recruiter", organizationId: authUser.organizationId },
        select: { id: true, mongoId: true, name: true, email: true }
      })
    ]);

    const clientIds = clients.map(c => c.id).concat(clients.map(c => c.mongoId).filter(Boolean));
    const orgRequirements = requirements.filter(r => clientIds.includes(r.clientId));

    // 2. Count statistics in-memory
    const clientsCount = clients.filter(c => c.status === 'Active' || c.status === 'active').length;
    const requirementsCount = orgRequirements.filter(r => r.status === 'Open' || r.status === 'open').length;
    const candidatesCount = candidates.length;
    
    const submissionsCount = submissions.filter(s => {
      const dataObj = typeof s.modelData === 'object' && s.modelData !== null ? s.modelData : {};
      return !['deployed', 'rejected', 'withdrawn'].includes(dataObj.stage);
    }).length;
    
    const deploymentsCount = submissions.filter(s => {
      const dataObj = typeof s.modelData === 'object' && s.modelData !== null ? s.modelData : {};
      return dataObj.stage === 'deployed';
    }).length;

    // 3. Build upload count map
    const uploadCountsMap = new Map();
    candidates.forEach(c => {
      const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      if (data.uploadedBy) {
        const uId = data.uploadedBy.toString();
        uploadCountsMap.set(uId, (uploadCountsMap.get(uId) || 0) + 1);
      }
    });

    // Build list of recruiters with resume counts
    const recruitersList = [];

    employees.forEach(emp => {
      const empIdStr = (emp.id || emp.mongoId || '').toString();
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || "Recruiter";
      recruitersList.push({
        _id: empIdStr,
        name: fullName,
        email: emp.email || "",
        designation: emp.designation || "HR Recruiter",
        candidatesCount: uploadCountsMap.get(empIdStr) || 0
      });
    });

    users.forEach(usr => {
      const usrIdStr = (usr.id || usr.mongoId || '').toString();
      if (!recruitersList.some(r => r._id === usrIdStr)) {
        recruitersList.push({
          _id: usrIdStr,
          name: usr.name || "Recruiter",
          email: usr.email || "",
          designation: "Recruiter Admin",
          candidatesCount: uploadCountsMap.get(usrIdStr) || 0
        });
      }
    });

    const recruitersCount = recruitersList.length;

    // 4. Resolve uploader names dynamically for recentCandidates
    const uploaderIds = [...new Set(candidates.map(c => {
      const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      return data.uploadedBy;
    }).filter(Boolean).map(id => id.toString()))];
    
    const uploaderMap = new Map();

    if (uploaderIds.length > 0) {
      const [recentEmployees, recentUsers] = await Promise.all([
        prisma.employee.findMany({
          where: { OR: [{ id: { in: uploaderIds } }, { mongoId: { in: uploaderIds } }] },
          select: { id: true, mongoId: true, firstName: true, lastName: true, role: true }
        }),
        prisma.user.findMany({
          where: { OR: [{ id: { in: uploaderIds } }, { mongoId: { in: uploaderIds } }] },
          select: { id: true, mongoId: true, name: true, role: true }
        })
      ]);

      recentEmployees.forEach(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        const empId = emp.id || emp.mongoId;
        if (emp.role === 'recruiter') {
          uploaderMap.set(empId.toString(), fullName || "Recruiter");
        } else {
          uploaderMap.set(empId.toString(), `Uploaded by Admin`);
        }
        if (emp.id) uploaderMap.set(emp.id.toString(), fullName || "Recruiter");
        if (emp.mongoId) uploaderMap.set(emp.mongoId.toString(), fullName || "Recruiter");
      });

      recentUsers.forEach(usr => {
        const usrId = usr.id || usr.mongoId;
        if (usr.role === 'recruiter') {
          uploaderMap.set(usrId.toString(), usr.name || "Recruiter");
        } else {
          uploaderMap.set(usrId.toString(), `Uploaded by Admin`);
        }
        if (usr.id) uploaderMap.set(usr.id.toString(), usr.name || "Recruiter");
        if (usr.mongoId) uploaderMap.set(usr.mongoId.toString(), usr.name || "Recruiter");
      });
    }

    // 5. Map candidates and sort by createdAt desc for recent candidates
    const mappedCandidates = candidates.map(c => {
      const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      return {
        ...c,
        ...data,
        id: c.id,
        _id: c.id,
        uploadedByName: data.uploadedBy 
          ? (uploaderMap.get(data.uploadedBy.toString()) || "Uploaded by Admin") 
          : "Uploaded by Admin"
      };
    });

    const recentCandidates = [...mappedCandidates]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // 6. Map and sort submissions for recent submissions
    const candidatesMap = {};
    mappedCandidates.forEach(c => {
      candidatesMap[c.id] = { id: c.id, _id: c.id, name: c.name || "Candidate", email: c.email };
      if (c.mongoId) {
        candidatesMap[c.mongoId] = { id: c.id, _id: c.id, name: c.name || "Candidate", email: c.email };
      }
    });

    const requirementsMap = {};
    orgRequirements.forEach(r => {
      const rd = typeof r.requirementData === 'object' && r.requirementData !== null ? r.requirementData : {};
      const client = clients.find(cl => cl.id === r.clientId || cl.mongoId === r.clientId);
      const clientData = client && typeof client.clientData === 'object' && client.clientData !== null ? client.clientData : {};
      const popClient = client ? {
        _id: client.id,
        id: client.id,
        organizationId: client.organizationId,
        name: client.name,
        status: client.status,
        ...clientData,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      } : null;
      const popReq = { id: r.id, _id: r.id, title: r.title, clientName: client?.name || "Client", clientId: popClient, ...rd };
      requirementsMap[r.id] = popReq;
      if (r.mongoId) {
        requirementsMap[r.mongoId] = popReq;
      }
    });

    const recentSubmissionsRaw = [...submissions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentSubmissions = recentSubmissionsRaw.map(s => {
      const dataObj = typeof s.modelData === 'object' && s.modelData !== null ? s.modelData : {};
      const candidate = dataObj.candidateId ? candidatesMap[dataObj.candidateId] : null;
      const requirement = dataObj.requirementId ? requirementsMap[dataObj.requirementId] : null;
      return {
        ...s,
        ...dataObj,
        id: s.id,
        _id: s.id,
        candidate,
        requirement,
        candidateId: candidate,
        requirementId: requirement
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        activeClients: clientsCount,
        openRequirements: requirementsCount,
        totalCandidates: candidatesCount,
        activeSubmissions: submissionsCount,
        totalDeployments: deploymentsCount,
        recruitersCount
      },
      recentSubmissions,
      recentCandidates,
      recruiters: recruitersList
    });
  } catch (error) {
    console.error("GET STAFFING DASHBOARD STATS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

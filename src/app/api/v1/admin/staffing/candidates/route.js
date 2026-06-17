import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db/prisma';




import { getAuthUser, authorize } from '@/lib/auth-util';
import { parseResumeFromPDF, calculateFitScore } from '@/lib/ai/gemini';
import cloudinary from '@/lib/cloudinary';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const skill = searchParams.get('skill') || '';

    const query = { organizationId: authUser.organizationId };

    // Fetch all candidates for the org, then filter in-memory since
    // parsedResume is a JSON field and can't be natively queried with regex
    const candidatesRaw = await prisma.staffingCandidate.findMany({ where: query });

    let candidates = candidatesRaw.map(c => {
      const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      return {
        ...c,
        ...data,
        id: c.id,
        _id: c.id
      };
    });

    if (skill) {
      const skillLower = skill.toLowerCase();
      candidates = candidates.filter(c => {
        const skills = c.parsedResume?.skills || [];
        return skills.some(s => s.toLowerCase() === skillLower);
      });
    } else if (search) {
      const searchLower = search.toLowerCase();
      candidates = candidates.filter(c => {
        const name = (c.name || '').toLowerCase();
        const skills = (c.parsedResume?.skills || []).join(' ').toLowerCase();
        const role = (c.parsedResume?.currentRole || '').toLowerCase();
        const summary = (c.parsedResume?.summary || '').toLowerCase();
        return name.includes(searchLower) || skills.includes(searchLower) || role.includes(searchLower) || summary.includes(searchLower);
      });
    }

    // Resolve uploader names dynamically
    const uploaderIds = [...new Set(candidates.map(c => c.uploadedBy).filter(Boolean).map(id => id.toString()))];
    const uploaderMap = new Map();

    if (uploaderIds.length > 0) {
      const [employees, users] = await Promise.all([
        prisma.employee.findMany({
          where: { OR: [{ id: { in: uploaderIds } }, { mongoId: { in: uploaderIds } }] },
          select: { id: true, mongoId: true, firstName: true, lastName: true, role: true }
        }),
        prisma.user.findMany({
          where: { OR: [{ id: { in: uploaderIds } }, { mongoId: { in: uploaderIds } }] },
          select: { id: true, mongoId: true, name: true, role: true }
        })
      ]);

      employees.forEach(emp => {
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

      users.forEach(usr => {
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

    const candidateList = candidates.map(c => {
      const candidateObj = { ...c };
      candidateObj.uploadedByName = c.uploadedBy 
        ? (uploaderMap.get(c.uploadedBy.toString()) || "Uploaded by Admin") 
        : "Uploaded by Admin";
      return candidateObj;
    });

    return NextResponse.json({ success: true, candidates: candidateList });
  } catch (error) {
    console.error("GET CANDIDATES ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: "No resume file provided" }, { status: 400 });
    }



    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse Resume using Gemini's native document understanding
    console.log("Parsing resume with Gemini...");
    let parsedData = null;
    try {
      parsedData = await parseResumeFromPDF(buffer, 'application/pdf');
    } catch (parseError) {
      if (parseError.name === 'GoogleAPIError') {
        return NextResponse.json({ 
          success: false, 
          errorType: 'GOOGLE_API_KEY_ERROR', 
          error: parseError.message 
        }, { status: 500 });
      }
      throw parseError; // Re-throw generic errors to catch block below
    }

    // If AI parsing completely fails, we gracefully fallback so the upload isn't blocked
    if (!parsedData) {
      console.warn("AI failed to parse the resume document. Falling back to basic file upload.");
      parsedData = {
        name: file.name.split('.')[0],
        email: `no-email-${Date.now()}@placeholder.com`,
        phone: "",
        skills: [],
        experience: [],
        education: [],
        summary: "AI Parsing Failed or Unavailable.",
        totalExperienceYears: 0,
        currentRole: "",
        currentCompany: ""
      };
    }

    const orgId = authUser.organizationId;
    let email = (parsedData.email || '').toLowerCase().trim();

    // Fallback if AI misses the email specifically
    if (!email) {
      email = `no-email-${Date.now()}@placeholder.com`;
      console.warn("AI missed email. Using placeholder: ", email);
    }

    // 2. Check for duplicate candidate
    const existingCandidates = await prisma.staffingCandidate.findMany({
      where: { organizationId: orgId }
    });
    const existing = existingCandidates.find(c => {
      const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      return (data.email || '').toLowerCase().trim() === email;
    });

    if (existing) {
      const data = typeof existing.modelData === 'object' && existing.modelData !== null ? existing.modelData : {};
      return NextResponse.json({
        success: false,
        error: `Candidate with email ${email} already exists in the talent pool.`,
        candidate: {
          ...existing,
          ...data,
          id: existing.id,
          _id: existing.id
        }
      }, { status: 409 });
    }

    // 3. Save PDF file locally
    const fileName = `resume_${Date.now()}_${(parsedData.name || file.name.split('.')[0]).replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_').toLowerCase()}.pdf`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    const filePath = path.join(uploadDir, fileName);
    let resumeUrl = `/uploads/resumes/${fileName}`;

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(filePath, buffer);
      console.log("Resume saved locally at:", resumeUrl);
    } catch (fsErr) {
      console.error('Failed to save resume locally:', fsErr?.message || fsErr);
    }

    // Optional: Save PDF file to Cloudinary (background/backup)
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET) {
      try {
        console.log("Uploading resume to Cloudinary as backup...");
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: "staffing/resumes",
              resource_type: "auto",
              public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0]}`
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary backup upload error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          stream.end(buffer);
        });
        
        if (uploadResult && uploadResult.secure_url) {
          resumeUrl = uploadResult.secure_url;
          console.log("Using Cloudinary URL for resume:", resumeUrl);
        }
      } catch (cloudinaryErr) {
        console.warn("Cloudinary backup upload failed, continuing with local storage:", cloudinaryErr);
      }
    }

    // 4. Create StaffingCandidate in DB
    const candidateDoc = await prisma.staffingCandidate.create({ data: {
      status: "available",
      organizationId: orgId,
      modelData: {
        name: parsedData.name || file.name.split('.')[0],
        email,
        phone: parsedData.phone || "",
        resumeUrl,
        parsedResume: {
          skills: parsedData.skills || [],
          experience: parsedData.experience || [],
          education: parsedData.education || [],
          summary: parsedData.summary || "",
          totalExperienceYears: parsedData.totalExperienceYears || 0,
          currentRole: parsedData.currentRole || "",
          currentCompany: parsedData.currentCompany || ""
        },
        uploadedBy: authUser.id
      }
    } });

    const dataObj = typeof candidateDoc.modelData === 'object' && candidateDoc.modelData !== null ? candidateDoc.modelData : {};
    const candidate = {
      ...candidateDoc,
      ...dataObj,
      id: candidateDoc.id,
      _id: candidateDoc.id
    };

    // 5. Run "Instant Match" against all currently open requirements
    console.log("Running instant match against open requirements...");
    const clients = await prisma.staffingClient.findMany({ where: { organizationId: orgId } });
    const clientIds = clients.map(c => c.id).concat(clients.map(c => c.mongoId).filter(Boolean));
    const openRequirements = await prisma.staffingRequirement.findMany({
      where: {
        clientId: { in: clientIds },
        status: 'Open'
      }
    });

    const matchPromises = openRequirements.map(async (req) => {
      try {
        const reqData = typeof req.requirementData === 'object' && req.requirementData !== null ? req.requirementData : {};
        const clientName = clients.find(cl => cl.id === req.clientId || cl.mongoId === req.clientId)?.name || "Client";
        const fitAnalysis = await calculateFitScore(parsedData, { ...req, ...reqData });
        return {
          requirement: {
            _id: req.id,
            id: req.id,
            title: req.title,
            clientName
          },
          fitScore: fitAnalysis.fitScore || 0,
          analysis: fitAnalysis.analysis || "",
          strengths: fitAnalysis.strengths || [],
          gaps: fitAnalysis.gaps || [],
          recommendation: fitAnalysis.recommendation || "Pending Review",
          success: true
        };
      } catch (err) {
        console.error(`AI matching error for requirement ${req.id}:`, err);
        const clientName = clients.find(cl => cl.id === req.clientId || cl.mongoId === req.clientId)?.name || "Client";
        return {
          requirement: {
            _id: req.id,
            id: req.id,
            title: req.title,
            clientName
          },
          success: false,
          errorType: err.name === 'GoogleAPIError' ? 'GOOGLE_API_KEY_ERROR' : 'UNKNOWN_ERROR',
          errorMessage: err.message
        };
      }
    });

    const matchResults = await Promise.all(matchPromises);
    const instantMatches = matchResults.filter(m => m.success);
    const failedMatches = matchResults.filter(m => !m.success);

    return NextResponse.json({
      success: true,
      candidate,
      instantMatches,
      failedMatches,
      message: "Resume uploaded, parsed, and matched successfully!"
    }, { status: 201 });

  } catch (error) {
    console.error("POST CANDIDATE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

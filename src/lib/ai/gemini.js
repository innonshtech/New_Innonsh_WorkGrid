// src/lib/ai/gemini.js — Central AI Service Layer (Google Gemini)
import { GoogleGenerativeAI } from '@google/generative-ai';

class GoogleAPIError extends Error {
    constructor(message, type) {
        super(message);
        this.name = 'GoogleAPIError';
        this.type = type; // e.g. "QUOTA_EXHAUSTED", "KEY_BLOCKED"
    }
}

let genAI = null;
let model = null;

function getAIModel() {
    if (!model) {
        const apiKey = process.env.GOOGLE_API_KEY || '';
        if (!apiKey) {
            console.warn("⚠️ GOOGLE_API_KEY is missing from environment variables.");
        }
        genAI = new GoogleGenerativeAI(apiKey);
        // Using the high-performance model found in your authorized list
        model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    }
    return model;
}

function extractAndParseJSON(text) {
    if (!text) return null;
    try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (err) {
        // Try extracting between first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            const jsonText = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonText);
            } catch (innerErr) {
                console.error("Failed to parse extracted JSON block:", innerErr);
            }
        }
        // Try extracting between first [ and last ]
        const startArr = text.indexOf('[');
        const endArr = text.lastIndexOf(']');
        if (startArr !== -1 && endArr !== -1) {
            const jsonText = text.substring(startArr, endArr + 1);
            try {
                return JSON.parse(jsonText);
            } catch (innerErr) {
                console.error("Failed to parse extracted JSON array block:", innerErr);
            }
        }
        throw err;
    }
}

/**
 * Enhanced: Generate content with automatic model fallback
 */
async function generateWithFallback(prompt, inlineData = null, retryCount = 0) {
    const aiModel = getAIModel();
    try {
        const payload = inlineData ? [prompt, { inlineData }] : prompt;
        const result = await aiModel.generateContent(payload);
        return result.response.text();
    } catch (e) {
        // Explicitly catch 429 Quota Exceeded
        if (e.message.includes('429') || e.message.includes('Quota') || e.message.includes('quota')) {
            console.error("🚨 GOOGLE API ERROR: Quota Exceeded (429)");
            throw new GoogleAPIError("Google Gemini API Key quota exhausted.", "QUOTA_EXHAUSTED");
        }
        
        // Explicitly catch 403 Forbidden / Key Blocked / 400 Bad Request
        if (e.message.includes('403') || e.message.includes('API_KEY_INVALID') || e.message.includes('API key not valid')) {
            console.error("🚨 GOOGLE API ERROR: Key Blocked or Invalid (403/400)");
            throw new GoogleAPIError("Google Gemini API Key is invalid or blocked.", "KEY_BLOCKED");
        }

        // Handle 503 Service Unavailable (High Demand) with a retry
        if (e.message.includes('503') || e.message.includes('Service Unavailable')) {
            if (retryCount < 2) {
                console.warn(`⚠️ Gemini 503 (High Demand). Retrying in 2 seconds... (Attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return generateWithFallback(prompt, inlineData, retryCount + 1);
            }
        }

        // If 404 or model error, try the next best model in your list: gemini-2.0-flash
        if (e.message.includes('404') || e.message.includes('not found') || e.message.includes('not supported')) {
            console.warn("🔄 Switching to fallback model (models/gemini-2.0-flash)...");
            const fallbackModel = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
            const payloadFallback = inlineData ? [prompt, { inlineData }] : prompt;
            const result = await fallbackModel.generateContent(payloadFallback);
            return result.response.text();
        }
        throw e;
    }
}

/**
 * Core: Generate content from Gemini
 */
async function generateContent(prompt) {
    return generateWithFallback(prompt);
}

/**
 * AI Job Description Generator
 * Gap Fix #1: AI-Powered JD Generation
 */
export async function generateJD({ title, department, type, location, seniority }) {
    const prompt = `You are an expert HR recruiter. Generate a professional job description for the following position.

Role: ${title}
Department: ${department}
Employment Type: ${type || 'Full-time'}
Location: ${location || 'Remote'}
Seniority: ${seniority || 'Mid-Level'}

Return your response STRICTLY as valid JSON (no markdown, no code blocks) with this exact structure:
{
  "description": "A compelling 3-4 paragraph job description covering role overview, responsibilities, what the candidate will do, and why they should join",
  "requirements": ["requirement 1", "requirement 2", "...up to 8 key requirements"],
  "skillsRequired": ["skill1", "skill2", "...up to 10 core technical/functional skills"],
  "salaryInsight": "A brief note about typical salary range for this role in India (INR)"
}

Make it professional, compelling, and suitable for job boards like LinkedIn/Naukri.`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        console.error('AI JD parse error:', e);
        return { description: text, requirements: [], skillsRequired: [], salaryInsight: '' };
    }
}

/**
 * AI Resume Parser
 * Gap Fix #2: Resume Parsing & Screening
 */
export async function parseResume(resumeText) {
    const prompt = `You are an expert HR resume analyst. Parse the following resume text and extract structured data.

RESUME TEXT:
---
${resumeText.substring(0, 5000)}
---

Return your response STRICTLY as valid JSON (no markdown, no code blocks) with this exact structure:
{
  "name": "Full name of the candidate",
  "email": "Email address if found, or empty string",
  "phone": "Phone number if found, or empty string",
  "summary": "A 2-3 sentence professional summary of the candidate",
  "skills": ["skill1", "skill2", "...all technical and soft skills found"],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "e.g. Jan 2020 - Dec 2023",
      "years": 3,
      "highlights": ["key achievement 1", "key achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University/College name",
      "degree": "Degree name",
      "year": "Graduation year"
    }
  ],
  "totalExperienceYears": 5,
  "currentRole": "Most recent job title",
  "currentCompany": "Most recent company"
}`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        console.error('AI Resume parse error:', e);
        return { name: '', email: '', phone: '', summary: text, skills: [], experience: [], education: [], totalExperienceYears: 0 };
    }
}

/**
 * AI Resume Parser from PDF Buffer (Native Gemini Document Understanding)
 * Sends the raw PDF to Gemini so it reads the document directly — no pdf-parse needed.
 */
export async function parseResumeFromPDF(buffer, mimeType = 'application/pdf') {
    const prompt = `You are an expert HR resume analyst. Read the attached resume document and extract structured data.

Return your response STRICTLY as valid JSON (no markdown, no code blocks) with this exact structure:
{
  "name": "Full name of the candidate",
  "email": "Email address if found, or empty string",
  "phone": "Phone number if found, or empty string",
  "summary": "A 2-3 sentence professional summary of the candidate",
  "skills": ["skill1", "skill2", "...all technical and soft skills found"],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "e.g. Jan 2020 - Dec 2023",
      "years": 3,
      "highlights": ["key achievement 1", "key achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University/College name",
      "degree": "Degree name",
      "year": "Graduation year"
    }
  ],
  "totalExperienceYears": 5,
  "currentRole": "Most recent job title",
  "currentCompany": "Most recent company",
  "rawText": "Return a complete plain-text dump of the entire resume content here so we can display it for human readability"
}`;

    const inlineData = {
        data: buffer.toString('base64'),
        mimeType
    };

    try {
        const text = await generateWithFallback(prompt, inlineData);
        if (!text) return null;
        return extractAndParseJSON(text);
    } catch (e) {
        if (e.name === 'GoogleAPIError') throw e; // Bubble up API quota errors
        console.error('AI Resume parse (PDF native) error:', e);
        return null;
    }
}

/**
 * AI Candidate-Job Fit Score
 * Gap Fix #3: Candidate Scoring
 */
export async function calculateFitScore(candidateProfile, jobRequirements) {
    const prompt = `You are an AI recruitment analyst. Calculate how well this candidate matches the job requirements.

CANDIDATE PROFILE:
- Skills: ${(candidateProfile.skills || []).join(', ')}
- Experience: ${candidateProfile.totalExperienceYears || 0} years
- Current Role: ${candidateProfile.currentRole || 'N/A'}
- Education: ${(candidateProfile.education || []).map(e => `${e.degree} from ${e.institution}`).join(', ') || 'N/A'}
- Summary: ${candidateProfile.summary || 'N/A'}

JOB REQUIREMENTS:
- Title: ${jobRequirements.title || 'N/A'}
- Department: ${jobRequirements.department || 'N/A'}
- Required Skills: ${(jobRequirements.skillsRequired || jobRequirements.requirements || []).join(', ')}
- Description: ${(jobRequirements.description || '').substring(0, 500)}

Return your response STRICTLY as valid JSON (no markdown, no code blocks):
{
  "fitScore": 78,
  "analysis": "2-3 sentence explanation of the match quality",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "Strong Hire" or "Potential Fit" or "Weak Match" or "Not Recommended"
}

Score from 0-100 where:
- 90-100: Perfect match
- 75-89: Strong match
- 60-74: Decent match
- 40-59: Weak match
- 0-39: Poor match`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        if (e.name === 'GoogleAPIError') throw e; // Bubble up API quota errors
        console.error('AI Fit Score parse error:', e);
        return { fitScore: 0, analysis: 'Unable to calculate', strengths: [], gaps: [], recommendation: 'Pending Review' };
    }
}

/**
 * AI Offer Letter Generator
 * Gap Fix #6: Offer Letter Auto-Generation
 */
export async function generateOfferLetter({ candidateName, jobTitle, department, salary, joiningDate, companyName }) {
    const prompt = `You are a professional HR manager. Generate a formal offer letter for the following candidate.

Candidate: ${candidateName}
Position: ${jobTitle}
Department: ${department || 'General'}
Annual CTC: ₹${(salary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
Joining Date: ${joiningDate}
Company: ${companyName || 'Bizmate Technologies'}

Return your response STRICTLY as valid JSON (no markdown, no code blocks):
{
  "subject": "Offer letter email subject line",
  "content": "Full professional offer letter in HTML format with proper styling. Include: greeting, position details, compensation, joining date, terms, and closing. Use inline CSS for styling with a clean, professional look.",
  "terms": ["term 1", "term 2", "term 3", "term 4", "term 5"]
}

Make the letter professional and warm. The HTML should be email-safe with inline styles.`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        console.error('AI Offer letter parse error:', e);
        return { subject: `Offer Letter - ${jobTitle}`, content: text, terms: [] };
    }
}

/**
 * AI Interview Question Generator
 */
export async function generateInterviewQuestions({ jobTitle, requirements, round, candidateSummary }) {
    const roundConfig = {
        'Screening': 'basic technical screening, cultural fit, and past experience overview',
        'Interviewing': 'in-depth technical skills, problem-solving, project management, and cultural fit',
        'Final Round': 'executive level alignment, compensation expectations, and long-term vision'
    };

    const prompt = `You are a senior interviewer. Generate ${round || 'Interviewing'} questions for this role.

Role: ${jobTitle}
Requirements: ${(requirements || []).join(', ')}
Round Type: ${round || 'Interviewing'}
Focus: ${roundConfig[round] || roundConfig['Interviewing']}
${candidateSummary ? `Candidate Background: ${candidateSummary}` : ''}

Return your response STRICTLY as valid JSON (no markdown, no code blocks):
{
  "questions": [
    {
      "question": "The interview question",
      "category": "Technical" or "Behavioral" or "Situational" or "Culture Fit",
      "difficulty": "Easy" or "Medium" or "Hard",
      "expectedAnswer": "Brief guidance on what a good answer looks like",
      "timeMinutes": 5
    }
  ],
  "totalTimeMinutes": 45,
  "tips": "Brief interviewer tips for this round"
}

Generate 8-10 questions with a good mix of difficulties.`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        console.error('AI Questions parse error:', e);
        return { questions: [], totalTimeMinutes: 0, tips: text };
    }
}

/**
 * AI Interview Feedback Summarizer
 * Gap Fix #5: AI Interview Feedback
 */
export async function summarizeFeedback(rawNotes, candidateName, round) {
    const prompt = `You are an HR analyst. Summarize the following interviewer feedback into a structured assessment.

Candidate: ${candidateName || 'Unknown'}
Interview Round: ${round || 'Interviewing'}

RAW FEEDBACK NOTES:
---
${rawNotes}
---

Return your response STRICTLY as valid JSON (no markdown, no code blocks):
{
  "technicalSkills": { "rating": 4, "notes": "Brief assessment of technical ability" },
  "communication": { "rating": 3, "notes": "Brief assessment of communication skills" },
  "problemSolving": { "rating": 4, "notes": "Brief assessment of problem-solving ability" },
  "cultureFit": { "rating": 5, "notes": "Brief assessment of culture alignment" },
  "overallRating": 4,
  "summary": "2-3 sentence overall assessment",
  "recommendation": "Strong Hire" or "Hire" or "Maybe" or "No Hire",
  "strengths": ["strength 1", "strength 2"],
  "concerns": ["concern 1", "concern 2"]
}

Rate each category from 1 (Poor) to 5 (Excellent).`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        console.error('AI Feedback parse error:', e);
        return { overallRating: 0, summary: text, recommendation: 'Needs Review' };
    }
}

/**
 * AI Smart Onboarding Task Generator
 * Gap Fix #12: Smart Onboarding
 */
export async function generateOnboardingTasks({ department, role, location }) {
    const prompt = `You are an HR onboarding specialist. Generate a customized onboarding checklist for a new employee.

Department: ${department || 'General'}
Role: ${role || 'New Joiner'}
Location: ${location || 'Office'}

Return your response STRICTLY as valid JSON (no markdown, no code blocks):
{
  "tasks": [
    {
      "category": "Documentation",
      "task": "Task description",
      "priority": "High" or "Medium" or "Low"
    }
  ]
}

Categories must be one of: "Documentation", "IT Setup", "Training", "Orientation", "Finance".
Generate 8-12 tasks tailored to the department and role. Include department-specific items.
For example: Engineering roles need GitHub/CI-CD access, Finance roles need ERP access, etc.`;

    const text = await generateContent(prompt);
    try {
        return extractAndParseJSON(text);
    } catch (e) {
        console.error('AI Onboarding parse error:', e);
        return {
            tasks: [
                { category: 'Documentation', task: 'Submit Personal Documents (ID/Address Proof)' },
                { category: 'Documentation', task: 'Sign Employment Agreement & Policies' },
                { category: 'IT Setup', task: 'Set up System & Corporate Email' },
                { category: 'Orientation', task: 'Company Culture & Values Introduction' },
                { category: 'Finance', task: 'Submit Bank Details & Tax Declaration' }
            ]
        };
    }
}

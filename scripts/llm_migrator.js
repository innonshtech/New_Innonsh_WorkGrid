const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
    console.error("No GOOGLE_API_KEY found in .env");
    process.exit(1);
}

const unmigratedFile = path.join(__dirname, '../unmigrated_routes.json');
const routes = JSON.parse(fs.readFileSync(unmigratedFile, 'utf8'));

const PROMPT = `You are an expert Next.js and Prisma developer.
Refactor the following Next.js API route to completely remove Mongoose and use Prisma instead.
Rules:
1. Replace "import dbConnect" with "import prisma from '@/lib/db/prisma'".
2. Remove any "await dbConnect()".
3. Remove Mongoose model imports.
4. Replace Mongoose queries (findById, findOne, find, create, insertMany, findByIdAndUpdate, findByIdAndDelete) with equivalent Prisma queries (findFirst, findMany, create, createMany, update, delete).
5. For Prisma lookups by ID, always use: { OR: [{ id: ... }, { mongoId: ... }] } because the ID might be a legacy MongoDB string.
6. For Mongoose .populate(), you do NOT need to fetch related data unless it's strictly used in the response. If it is used, do it manually or skip include if too complex (assume the frontend just uses IDs for now).
7. VERY IMPORTANT: Output ONLY the raw refactored code. NO MARKDOWN formatting, NO \`\`\`javascript wrappers, NO explanations. Just the code.`;

async function rewriteFile(filePath) {
    const fullPath = path.join(__dirname, '../src/app/api', filePath);
    console.log(`Processing: ${filePath}`);
    const code = fs.readFileSync(fullPath, 'utf8');

    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            contents: [{ parts: [{ text: PROMPT + "\n\nFile Content:\n" + code }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        let newCode = response.data.candidates[0].content.parts[0].text;
        
        // Cleanup markdown if it accidentally outputs it
        newCode = newCode.replace(/^```javascript\n/, '').replace(/^```\n/, '').replace(/```$/, '');
        newCode = newCode.trim();

        if (newCode && newCode.includes('import prisma from')) {
            fs.writeFileSync(fullPath, newCode, 'utf8');
            console.log(`✅ Success: ${filePath}`);
            return true;
        } else {
            console.log(`❌ Failed (Invalid output): ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error calling Gemini API for ${filePath}:`, error?.response?.data || error.message);
        return false;
    }
}

async function run() {
    let successCount = 0;
    // Process first 10 for testing
    const testRoutes = routes.slice(0, 10);
    
    for (const route of testRoutes) {
        const success = await rewriteFile(route);
        if (success) successCount++;
        // Rate limit protection
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log(`Finished processing 10 files. ${successCount} succeeded.`);
}

run();

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
4. Replace Mongoose queries (findById, findOne, find, create, insertMany, findByIdAndUpdate, findByIdAndDelete, updateMany, deleteMany) with equivalent Prisma queries (findFirst, findMany, create, createMany, update, delete, updateMany, deleteMany).
5. For Prisma lookups by ID, always use: { OR: [{ id: ... }, { mongoId: ... }] } because the ID might be a legacy MongoDB string.
6. For Mongoose .populate(), you do NOT need to fetch related data unless it's strictly used in the response. If it is used, map it properly.
7. VERY IMPORTANT: Output ONLY the raw refactored code. NO MARKDOWN formatting, NO \`\`\`javascript wrappers, NO explanations. Just the code.`;

async function rewriteFile(filePath, retryCount = 0) {
    const fullPath = path.join(__dirname, '../src/app/api', filePath);
    console.log(`Processing: ${filePath} (Attempt ${retryCount + 1})`);
    let code;
    try {
        code = fs.readFileSync(fullPath, 'utf8');
    } catch (e) {
        console.log(`File not found, skipping: ${filePath}`);
        return true; // skip
    }

    // Check if already migrated
    if (!code.includes('dbConnect') && !code.includes('mongoose')) {
        console.log(`Already migrated, skipping: ${filePath}`);
        return true;
    }

    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            contents: [{ parts: [{ text: PROMPT + "\n\nFile Content:\n" + code }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.data.candidates || !response.data.candidates[0].content) {
            console.log(`❌ Failed (No content): ${filePath}`);
            return false;
        }

        let newCode = response.data.candidates[0].content.parts[0].text;
        
        // Cleanup markdown if it accidentally outputs it
        newCode = newCode.replace(/^```javascript\n/, '').replace(/^```\n/, '').replace(/```$/, '');
        newCode = newCode.replace(/^```typescript\n/, '');
        newCode = newCode.replace(/\\`/g, '`'); // FIX STRAY ESCAPED BACKTICKS
        newCode = newCode.replace(/\\\$\{/g, '${'); // FIX STRAY ESCAPED DOLLAR SIGNS
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
        const status = error?.response?.status;
        console.error(`❌ Error calling Gemini API for ${filePath}:`, status ? `${status} ${error.response.statusText}` : error.message);
        
        if (status === 503 || status === 429) {
            // Infinite retry for rate limits / high demand, but cap wait time to 60 seconds
            const waitTime = Math.min(Math.pow(2, retryCount) * 5000, 60000);
            console.log(`Rate limited (${status}). Waiting ${waitTime}ms before retry...`);
            await new Promise(r => setTimeout(r, waitTime));
            return rewriteFile(filePath, retryCount + 1);
        }
        return false;
    }
}

async function run() {
    let successCount = 0;
    
    // We process ALL files
    for (const route of routes) {
        const success = await rewriteFile(route);
        if (success) successCount++;
        
        // STRICT RATE LIMIT: 15 Requests per minute = 1 request every 4 seconds. 
        // We wait 4500ms to be extremely safe.
        await new Promise(r => setTimeout(r, 4500));
    }
    
    console.log(`Finished processing ${routes.length} files. ${successCount} succeeded.`);
}

run();

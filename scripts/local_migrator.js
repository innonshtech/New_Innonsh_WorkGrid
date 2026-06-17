const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, '../unmigrated_routes.json');
let routes = [];
try {
    routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
} catch (e) {
    console.error("Could not read unmigrated_routes.json");
    process.exit(1);
}

let successCount = 0;
let errorCount = 0;

for (const route of routes) {
    const fullPath = path.join(__dirname, '../src/app/api', route);
    try {
        let code = fs.readFileSync(fullPath, 'utf8');

        // Check if already migrated
        if (!code.includes('dbConnect') && !code.includes('mongoose')) {
            console.log(`Already migrated: ${route}`);
            successCount++;
            continue;
        }

        console.log(`Migrating locally: ${route}`);

        // 1. Replace Imports
        code = code.replace(/import\s+dbConnect\s+from\s+['"]@\/lib\/db\/connect['"];?/g, "import prisma from '@/lib/db/prisma';");
        code = code.replace(/import\s+mongoose\s+from\s+['"]mongoose['"];?/g, "");
        
        // Remove Mongoose model imports
        code = code.replace(/import\s+[A-Za-z0-9_]+\s+from\s+['"]@\/lib\/db\/models\/.*['"];?\n?/g, "");

        // 2. Remove dbConnect calls
        code = code.replace(/await\s+dbConnect\(\);?/g, "");

        // 3. Replace Mongoose ObjectId casting
        code = code.replace(/new\s+mongoose\.Types\.ObjectId\(([^)]+)\)/g, "$1");
        code = code.replace(/mongoose\.Types\.ObjectId\.isValid\(([^)]+)\)/g, "true"); // Dummy replace

        // 4. Basic Query replacements
        // Model.find(...) -> prisma.model.findMany({ where: ... })
        // Note: This uses a replacer function to lower-case the model name
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.find\(([^)]*)\)/g, (match, model, query) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            if (!query || query.trim() === '') return `prisma.${lowerModel}.findMany()`;
            return `prisma.${lowerModel}.findMany({ where: ${query} })`;
        });

        // Model.findOne(...) -> prisma.model.findFirst({ where: ... })
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.findOne\(([^)]+)\)/g, (match, model, query) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            return `prisma.${lowerModel}.findFirst({ where: ${query} })`;
        });

        // Model.findById(id) -> prisma.model.findFirst({ where: { OR: [{ id }, { mongoId: id }] } })
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.findById\(([^)]+)\)/g, (match, model, id) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            return `prisma.${lowerModel}.findFirst({ where: { OR: [{ id: ${id} }, { mongoId: ${id} }] } })`;
        });

        // Model.create(payload) -> prisma.model.create({ data: payload })
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.create\(([^)]+)\)/g, (match, model, payload) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            return `prisma.${lowerModel}.create({ data: ${payload} })`;
        });

        // Model.findByIdAndUpdate(id, data) -> prisma.model.update({ where: { OR: [{id}, {mongoId:id}] }, data })
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.findByIdAndUpdate\(([^,]+),\s*([^,)]+)(?:,\s*[^)]+)?\)/g, (match, model, id, data) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            return `prisma.${lowerModel}.update({ where: { OR: [{ id: ${id} }, { mongoId: ${id} }] }, data: ${data} })`;
        });

        // Model.findByIdAndDelete(id) -> prisma.model.delete({ where: { OR: [{id}, {mongoId:id}] } })
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.findByIdAndDelete\(([^)]+)\)/g, (match, model, id) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            return `prisma.${lowerModel}.delete({ where: { OR: [{ id: ${id} }, { mongoId: ${id} }] } })`;
        });

        // Model.countDocuments(query) -> prisma.model.count({ where: query })
        code = code.replace(/([A-Z][A-Za-z0-9_]*)\.countDocuments\(([^)]*)\)/g, (match, model, query) => {
            const lowerModel = model.charAt(0).toLowerCase() + model.slice(1);
            if (!query || query.trim() === '') return `prisma.${lowerModel}.count()`;
            return `prisma.${lowerModel}.count({ where: ${query} })`;
        });

        // Handle .populate (basic strip or map to include)
        // Very basic naive strip because populate is hard to regex perfectly if chained
        code = code.replace(/\.populate\([^)]+\)/g, "");
        
        // Handle .skip and .limit and .sort
        code = code.replace(/\.skip\(([^)]+)\)/g, "");
        code = code.replace(/\.limit\(([^)]+)\)/g, "");
        code = code.replace(/\.sort\([^)]+\)/g, "");

        // Save file
        fs.writeFileSync(fullPath, code, 'utf8');
        successCount++;

    } catch (err) {
        console.error(`Error processing ${route}:`, err.message);
        errorCount++;
    }
}

console.log("-----------------------------------------");
console.log(`Local Migration Complete!`);
console.log(`Successfully processed: ${successCount}`);
console.log(`Errors: ${errorCount}`);
console.log("Note: This was a fast regex migration. Some complex queries may require manual fixing.");

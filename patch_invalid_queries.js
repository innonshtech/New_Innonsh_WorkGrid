const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, callback);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            callback(filePath);
        }
    }
}

// Regex to capture prisma.<model>.<method>({ where: { OR: [{ id: <id> }, { mongoId: <id> }] }
// We allow whitespace and newlines inside the match.
const regex = /prisma\.([a-zA-Z0-9_]+)\.(update|delete)\(\{\s*where\s*:\s*\{\s*OR\s*:\s*\[\s*\{\s*id\s*:\s*([^}]+?)\s*\}\s*,\s*\{\s*mongoId\s*:\s*([^}]+?)\s*\}\s*\]\s*\}/g;

let count = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    const newContent = content.replace(regex, (match, model, method, idVar, mongoIdVar) => {
        const cleanedIdVar = idVar.trim().replace(/\s+/g, ' ');
        count++;
        modified = true;
        
        console.log(`Patching ${method} on prisma.${model} in ${path.relative(__dirname, filePath)} (variable: ${cleanedIdVar})`);
        
        return `prisma.${model}.${method}({ where: { id: (await prisma.${model}.findFirst({ where: { OR: [{ id: ${cleanedIdVar} }, { mongoId: ${cleanedIdVar} }] }, select: { id: true } }))?.id || ${cleanedIdVar} }`;
    });

    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
    }
});

console.log(`\n🎉 Completed patching. Modified ${count} queries.`);

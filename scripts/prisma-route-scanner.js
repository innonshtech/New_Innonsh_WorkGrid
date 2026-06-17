const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../src/app/api');

function scanDir(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            results = results.concat(scanDir(fullPath));
        } else if (file === 'route.js' || file === 'route.ts') {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('dbConnect') || content.includes('mongoose')) {
                results.push(fullPath.replace(path.join(__dirname, '../src/app/api'), '').replace(/\\/g, '/'));
            }
        }
    }
    
    return results;
}

const unmigrated = scanDir(targetDir);
console.log(`Found ${unmigrated.length} routes still requiring migration:`);
unmigrated.forEach(r => console.log(r));

fs.writeFileSync(path.join(__dirname, '../unmigrated_routes.json'), JSON.stringify(unmigrated, null, 2));

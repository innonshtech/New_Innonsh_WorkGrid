const fs = require('fs');

function fixLayout(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the h2 wrapper div and its contents completely
    const regex = /<div className="flex flex-col items-start gap-1 ml-2">\s*<h2 className="text-base sm:text-xl font-bold text-slate-800 leading-none">.*?<\/h2>\s*<\/div>/s;
    if (regex.test(content)) {
        content = content.replace(regex, '');
        fs.writeFileSync(filePath, content);
        console.log('Fixed', filePath);
    } else {
        console.log('Not found in', filePath);
    }
}

fixLayout('src/app/employee/layout.jsx');
fixLayout('src/app/admin/layout.jsx');
fixLayout('src/app/super-admin/layout.jsx');
fixLayout('src/app/hr_recurter/layout.jsx');

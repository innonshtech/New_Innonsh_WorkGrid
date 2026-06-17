const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip floating components and UI components definition
    if (line.match(/(DropdownMenuContent|DialogContent|PopoverContent|TooltipContent|SelectContent)/) || filePath.includes('components\\ui\\')) {
        continue;
    }

    // Specifically exclude buttons if they have shadows, maybe we don't want to touch buttons?
    // User didn't ask to remove shadows from buttons. 
    // Wait, the user said "Remove All Shadows Globally"
    
    // Replace shadow- and drop-shadow- classes
    if (line.match(/\b(shadow|drop-shadow)(-[a-zA-Z0-9\[\]\/\-]+)?\b/g)) {
        let newLine = line.replace(/\s?\b(shadow|drop-shadow)(-[a-zA-Z0-9\[\]\/\-]+)?\b/g, '');
        
        // Standardize border colors to border-slate-200
        newLine = newLine.replace(/\bborder-(indigo|slate|gray|blue)-(50|100)\b/g, 'border-slate-200');

        if (newLine !== line) {
            lines[i] = newLine;
            changed = true;
        }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log("Updated: " + filePath);
  }
}

function walkSync(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && (filepath.endsWith('.jsx') || filepath.endsWith('.tsx'))) {
      callback(filepath);
    }
  });
}

walkSync(path.join(__dirname, 'src/app'), processFile);
walkSync(path.join(__dirname, 'src/components'), processFile);

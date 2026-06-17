const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace cases where options object exists but timeZone is not there
  content = content.replace(/toLocaleTimeString\(\s*['"]en-[a-zA-Z]+['"]\s*,\s*\{\s*/g, "toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', ");
  content = content.replace(/toLocaleDateString\(\s*['"]en-[a-zA-Z]+['"]\s*,\s*\{\s*/g, "toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', ");
  content = content.replace(/toLocaleString\(\s*['"]en-[a-zA-Z]+['"]\s*,\s*\{\s*/g, "toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', ");

  // Replace cases without options
  content = content.replace(/toLocaleTimeString\(\s*['"]en-[a-zA-Z]+['"]\s*\)/g, "toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })");
  content = content.replace(/toLocaleDateString\(\s*['"]en-[a-zA-Z]+['"]\s*\)/g, "toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })");
  content = content.replace(/toLocaleString\(\s*['"]en-[a-zA-Z]+['"]\s*\)/g, "toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })");

  // Replace empty parameter cases
  content = content.replace(/toLocaleTimeString\(\s*\)/g, "toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })");
  content = content.replace(/toLocaleDateString\(\s*\)/g, "toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })");
  content = content.replace(/toLocaleString\(\s*\)/g, "toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Updated', file);
  }
});
console.log('Total files updated:', changedFiles);

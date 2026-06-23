const fs = require('fs');

const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');

let inModel = false;
let modelName = '';
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('model ')) {
    modelName = line.split(' ')[1];
    if (modelName.toLowerCase().includes('tax') || modelName.toLowerCase().includes('investment') || modelName.toLowerCase().includes('section')) {
      inModel = true;
      console.log(`\nLine ${i + 1}: ${line}`);
      continue;
    }
  }
  if (inModel) {
    console.log(`  ${line}`);
    if (line.startsWith('}')) {
      inModel = false;
    }
  }
}

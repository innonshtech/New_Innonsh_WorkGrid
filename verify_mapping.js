const fs = require('fs');
const path = require('path');

function getMongooseModels(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getMongooseModels(filePath, fileList);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Look for mongoose.model('ModelName', ...) or mongoose.models.ModelName
      const match1 = content.match(/mongoose\.model\(['"]([^'"]+)['"]/g);
      const match2 = content.match(/mongoose\.models\.([^ \.]+)/g);
      
      if (match1) {
        match1.forEach(m => {
          const modelName = m.split(/['"]/)[1];
          fileList.push(modelName);
        });
      }
      if (match2) {
        match2.forEach(m => {
          const modelName = m.split('.')[2];
          if(modelName !== 'User' && !modelName.includes('||')) {
            fileList.push(modelName);
          }
        });
      }
    }
  }
  return [...new Set(fileList)];
}

const prismaSchema = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf-8');
const prismaModels = [];
const modelMatches = prismaSchema.match(/model\s+([A-Za-z0-9_]+)\s+{/g);
if (modelMatches) {
  modelMatches.forEach(m => {
    const modelName = m.replace('model ', '').replace(' {', '').trim();
    prismaModels.push(modelName.toLowerCase());
  });
}

const mongooseModels = getMongooseModels(path.join(__dirname, 'src/lib/db/models'));

console.log("=== Mongoose Models Found ===");
console.log(mongooseModels.length);

const unmapped = [];
mongooseModels.forEach(model => {
  if (!prismaModels.includes(model.toLowerCase())) {
    unmapped.push(model);
  }
});

console.log("\=== UNMAPPED MODELS ===");
if (unmapped.length === 0) {
  console.log("🎉 ALL Mongoose models are successfully mapped to Prisma!");
} else {
  console.log(unmapped);
}

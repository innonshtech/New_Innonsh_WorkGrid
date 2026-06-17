const fs = require('fs');
const path = require('path');

// Identify unmapped models
const prismaSchemaPath = path.join(__dirname, 'prisma/schema.prisma');
const prismaSchema = fs.readFileSync(prismaSchemaPath, 'utf-8');
const prismaModels = [];
const modelMatches = prismaSchema.match(/model\s+([A-Za-z0-9_]+)\s+{/g);
if (modelMatches) {
  modelMatches.forEach(m => {
    const modelName = m.replace('model ', '').replace(' {', '').trim();
    prismaModels.push(modelName.toLowerCase());
  });
}

function getMongooseModels(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getMongooseModels(filePath, fileList);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const match1 = content.match(/mongoose\.model\(['"]([^'"]+)['"]/g);
      const match2 = content.match(/mongoose\.models\.([^ \.]+)/g);
      
      let modelsInFile = [];
      if (match1) {
        match1.forEach(m => modelsInFile.push(m.split(/['"]/)[1]));
      }
      if (match2) {
        match2.forEach(m => {
          const name = m.split('.')[2].replace(/[^A-Za-z0-9_]/g, '');
          if(name && name !== 'User') modelsInFile.push(name);
        });
      }

      modelsInFile = [...new Set(modelsInFile)];
      
      modelsInFile.forEach(modelName => {
        if (!prismaModels.includes(modelName.toLowerCase())) {
          fileList.push(modelName);
        }
      });
    }
  }
  return [...new Set(fileList)];
}

const unmapped = getMongooseModels(path.join(__dirname, 'src/lib/db/models'));

let appendText = `\n// --- AUTO-GENERATED PERIPHERAL MODELS ---\n`;

unmapped.forEach(modelName => {
  // A generic fallback table for the peripheral schemas
  appendText += `
model ${modelName} {
  id              String    @id @default(uuid())
  mongoId         String?   @unique
  organizationId  String?
  employeeId      String?
  status          String?   @default("Active")
  modelData       Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
`;
});

if (unmapped.length > 0) {
    fs.appendFileSync(prismaSchemaPath, appendText);
    console.log(`✅ Appended ${unmapped.length} unmapped models to schema.prisma as generic JSON structures!`);
} else {
    console.log(`✅ All models already mapped.`);
}


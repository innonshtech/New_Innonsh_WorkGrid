const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
console.log("ALL PRISMA MODELS (" + models.length + "):");
console.log(models.join('\n'));
prisma.$disconnect();

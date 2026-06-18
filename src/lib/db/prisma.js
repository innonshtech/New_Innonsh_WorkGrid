import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Use a Proxy to strictly lazy-load the PrismaClient.
// This guarantees `new PrismaClient()` is NEVER called during Vercel's build phase (which causes SIGSEGVs and Initialization errors)
// because Turbopack only traces imports but doesn't execute queries.
const prisma = globalForPrisma.prisma || new Proxy({}, {
  get(target, prop) {
    if (!globalForPrisma._prismaInstance) {
      globalForPrisma._prismaInstance = new PrismaClient();
    }
    return globalForPrisma._prismaInstance[prop];
  }
});

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Prevent Prisma from crashing Vercel's build container if DB URL is missing during the static build phase
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is missing. Returning mock PrismaClient to prevent build crashes.");
    return {};
  }
  return new PrismaClient();
}

// Ensure there is only one Prisma instance globally
const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

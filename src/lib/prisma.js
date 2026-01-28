import { PrismaClient } from '@prisma/client'

// Use global prisma instance in serverless to prevent connection issues
const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }

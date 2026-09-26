import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:mypassword123@127.0.0.1:5433/ceylon_wheels?schema=public",
            },
        },
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
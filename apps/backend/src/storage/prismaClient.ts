import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required to initialize PrismaClient');
    }

    if (databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://')) {
      prismaClient = new PrismaClient({
        accelerateUrl: databaseUrl,
      });
    } else {
      const adapter = new PrismaPg({ connectionString: databaseUrl });
      prismaClient = new PrismaClient({ adapter });
    }
  }

  return prismaClient;
}

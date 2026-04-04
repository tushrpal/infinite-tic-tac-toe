import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required to initialize PrismaClient');
    }

    const sharedOptions: ConstructorParameters<typeof PrismaClient>[0] = {
      log: ['error', 'warn'],
    };

    if (databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://')) {
      prismaClient = new PrismaClient({
        ...sharedOptions,
        accelerateUrl: databaseUrl,
      });
    } else {
      const adapter = new PrismaPg({ connectionString: databaseUrl });
      prismaClient = new PrismaClient({ ...sharedOptions, adapter });
    }

  }

  return prismaClient;
}

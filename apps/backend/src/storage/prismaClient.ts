import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type PoolConfig = Exclude<ConstructorParameters<typeof PrismaPg>[0], string | undefined>;

let prismaClient: PrismaClient | null = null;

/**
 * Builds the pg pool config for the Prisma adapter.
 *
 * pg lets values in the connection string override an explicit `ssl` option, and it treats
 * `sslmode=require` as full certificate verification. Supabase's pooler certificate chain is not
 * in Node's default CA store, so that fails with "self-signed certificate in certificate chain".
 * We therefore strip `sslmode` from the URL and set `ssl` ourselves, matching libpq semantics:
 * - `disable` / no sslmode: plain connection (local Docker Postgres).
 * - `require` / `prefer`: encrypted, certificate not verified (what libpq and Prisma CLI do).
 * - `verify-ca` / `verify-full`, or DATABASE_SSL_CA set: certificate verified.
 * DATABASE_SSL_CA holds the PEM contents of the CA certificate (Supabase: Database Settings ->
 * SSL Configuration -> Download certificate); literal "\n" sequences are accepted.
 */
function buildPoolConfig(databaseUrl: string): PoolConfig {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return { connectionString: databaseUrl };
  }

  const sslMode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  const connectionString = url.toString();

  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n');
  if (ca) {
    return { connectionString, ssl: { ca, rejectUnauthorized: true } };
  }
  if (sslMode === 'verify-ca' || sslMode === 'verify-full') {
    return { connectionString, ssl: { rejectUnauthorized: true } };
  }
  if (sslMode === 'require' || sslMode === 'prefer' || sslMode === 'no-verify') {
    return { connectionString, ssl: { rejectUnauthorized: false } };
  }
  return { connectionString };
}

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
      const adapter = new PrismaPg(buildPoolConfig(databaseUrl));
      prismaClient = new PrismaClient({ ...sharedOptions, adapter });
    }

  }

  return prismaClient;
}

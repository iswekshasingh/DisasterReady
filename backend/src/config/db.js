import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

let prismaInstance = null;

/**
 * Returns a singleton instance of PrismaClient configured with PrismaPg driver adapter (Prisma v7 convention).
 */
export const getPrismaClient = () => {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL || '';
    const adapter = new PrismaPg({ connectionString });
    prismaInstance = new PrismaClient({ adapter });
  }
  return prismaInstance;
};

// Export proxy for convenient lazy access
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getPrismaClient();
      return client[prop];
    },
  }
);

export default prisma;


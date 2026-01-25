import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import { bearer } from 'better-auth/plugins';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  url: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  plugins: [bearer()],
});

export default auth;

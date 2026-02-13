import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import { admin, bearer } from 'better-auth/plugins';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  url: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({ adapter });

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  trustedOrigins: [process.env.FRONTEND_URL!],

  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: 'string', input: false, defaultValue: 'USER' },
    },
  },
  plugins: [
    bearer(),
    admin({
      defaultRole: 'USER',
      adminRoles: 'ADMIN',
    }),
  ],
  advanced: {
    disableOriginCheck: true,
    disableCSRFCheck: true,
    useSecureCookies: true,
    trustedOrigins: [process.env.TRUSTED_ORIGINS],
  },
});

export default auth;

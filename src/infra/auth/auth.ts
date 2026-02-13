import { PrismaService } from '@infra/database/prisma.service';
import { MailerService } from '@infra/mailer/mailer.service';
import { authTemplates } from '@infra/mailer/templates/auth-templates';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer, customSession } from 'better-auth/plugins';

export function createAuth(prisma: PrismaService, mailer: MailerService) {
  return betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    secret: process.env.BETTER_AUTH_SECRET!,
    url: process.env.BETTER_AUTH_URL!,

    user: {
      additionalFields: {
        role: {
          type: 'string',
          input: false,
          defaultValue: 'USER',
        },
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },

    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        const html = authTemplates.verification(user.name, url);
        await mailer.sendEmail(user.email, 'Verifikasi Akun Noku Coffee', html);
      },
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID! as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET! as string,
        prompt: 'select_account',
      },
    },

    trustedOrigins: [process.env.FRONTEND_URL!],
    plugins: [
      bearer(),
      admin({
        defaultRole: 'USER',
        adminRoles: 'ADMIN',
      }),
      customSession(async ({ user, session }) => {
        const address = await prisma.address.findMany({
          where: { userId: session.userId },
        });
        return {
          user: {
            ...user,
            address,
          },
          session,
        };
      }),
    ],
    advanced: {
      disableOriginCheck: true,
      disableCSRFCheck: true,
      useSecureCookies: true,
      trustedOrigins: [process.env.TRUSTED_ORIGINS],
    },
  });
}

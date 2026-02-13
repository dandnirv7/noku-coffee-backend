import { Prisma } from 'generated/prisma/client';

export const verifications: Prisma.VerificationCreateManyInput[] = [
  {
    id: 'ver_001',
    identifier: 'john@example.com',
    value: 'mock_verification_token',
    expiresAt: new Date(new Date().setHours(new Date().getHours() + 24)),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

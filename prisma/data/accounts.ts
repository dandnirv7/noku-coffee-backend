import { hash } from 'argon2';
import { Prisma } from 'generated/prisma/client';

export const getAccounts = async (): Promise<
  Prisma.AccountCreateManyInput[]
> => [
  {
    id: 'acc_admin_001',
    accountId: 'google_admin_id',
    providerId: 'google',
    userId: 'user_admin_001',
    accessToken: 'mock_access_token_admin',
    refreshToken: 'mock_refresh_token_admin',
    password: await hash('passwordAdmin123'),
  },
  {
    id: 'acc_regular_001',
    accountId: 'google_user_id',
    providerId: 'google',
    userId: 'user_regular_001',
    accessToken: 'mock_access_token_user',
    refreshToken: 'mock_refresh_token_user',
    password: await hash('passwordUser123'),
  },
  {
    id: 'acc_regular_002',
    accountId: 'google_user_id',
    providerId: 'google',
    userId: 'user_regular_002',
    accessToken: 'mock_access_token_user',
    refreshToken: 'mock_refresh_token_user',
    password: await hash('passwordUser123'),
  },
];

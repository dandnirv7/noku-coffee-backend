import { Prisma, UserRole } from 'generated/prisma/client';

export const users: Prisma.UserCreateManyInput[] = [
  {
    id: 'user_admin_001',
    name: 'Admin Noku',
    email: 'admin@noku.coffee',
    role: UserRole.ADMIN,
    emailVerified: true,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_regular_001',
    name: 'John Coffee',
    email: 'john@example.com',
    role: UserRole.USER,
    emailVerified: true,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user_regular_002',
    name: 'Jane Espresso',
    email: 'jane@example.com',
    role: UserRole.USER,
    emailVerified: true,
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

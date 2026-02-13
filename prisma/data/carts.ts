import { Prisma } from 'generated/prisma/client';

export const carts: Prisma.CartCreateManyInput[] = [
  {
    id: 'cart_regular_001',
    userId: 'user_regular_001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cart_regular_002',
    userId: 'user_regular_002',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

import { Prisma } from 'generated/prisma/client';

export const wishlistItems: Prisma.WishlistItemCreateManyInput[] = [
  {
    id: 'wi_001',
    userId: 'user_regular_001',
    productId: 'zx2cnlyiyoldegm86irnbnp6',
    createdAt: new Date(),
  },
  {
    id: 'wi_002',
    userId: 'user_regular_001',
    productId: 'car4vtpj4myzeadbsbosxutu',
    createdAt: new Date(),
  },
  {
    id: 'wi_003',
    userId: 'user_regular_002',
    productId: 'jro2klkyqzo7luv228p1nfb9',
    createdAt: new Date(),
  },
];

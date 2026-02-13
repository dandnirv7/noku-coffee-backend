import { Prisma } from 'generated/prisma/client';

export const cartItems: Prisma.CartItemCreateManyInput[] = [
  {
    id: 'ci_001',
    cartId: 'cart_regular_001',
    productId: 'pxxfaky0vbqnn0j9erfjwm2o',
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ci_002',
    cartId: 'cart_regular_001',
    productId: 'mczgpka3nj2k6p9jgj7jqr0r',
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

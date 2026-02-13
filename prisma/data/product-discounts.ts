import { DiscountType, Prisma } from 'generated/prisma/client';

export const productDiscounts: Prisma.ProductDiscountCreateManyInput[] = [
  {
    productId: 'pxxfaky0vbqnn0j9erfjwm2o',
    type: DiscountType.PERCENTAGE,
    value: new Prisma.Decimal(15),
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    productId: 'gusckqi2i0qjhyp8c64du9p6',
    type: DiscountType.FIXED,
    value: new Prisma.Decimal(10000),
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

import { Prisma, DiscountType } from 'generated/prisma/client';

export const promoCodes: Prisma.PromoCodeCreateManyInput[] = [
  {
    id: 'pc_welcome10',
    code: 'WELCOME10',
    description: 'Diskon 10% untuk pengguna baru',
    type: DiscountType.PERCENTAGE,
    value: new Prisma.Decimal(10),
    maxDiscount: new Prisma.Decimal(50000),
    minOrderAmount: new Prisma.Decimal(100000),
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    isActive: true,
    usageLimit: 100,
    usagePerUser: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pc_hemat20k',
    code: 'HEMAT20K',
    description: 'Potongan Rp 20.000',
    type: DiscountType.FIXED,
    value: new Prisma.Decimal(20000),
    minOrderAmount: new Prisma.Decimal(150000),
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isActive: true,
    usageLimit: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

import { PrismaService } from '@infra/database/prisma.service';
import { Decimal } from '@prisma/client/runtime/client';

const prisma = new PrismaService();

export async function seedDailyDiscount() {
  const todayKey = new Date().toISOString().split('T')[0];

  const existing = await prisma.dailyDiscount.findFirst({
    where: { dayKey: todayKey },
  });

  if (existing) {
    console.log(`ℹ️ Discount already exists for ${todayKey}: ${existing.id}`);
    return;
  }

  const product = await prisma.product.findFirst({
    where: {
      stock: { gt: 0 },
      deletedAt: null,
    },
  });

  if (!product) {
    console.error('❌ No valid product found. Cannot seed discount.');
    return;
  }

  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const targetUserIds =
    allUsers.length === 0
      ? []
      : allUsers
          .sort(() => 0.5 - Math.random())
          .slice(0, 50)
          .map((u) => u.id);

  const discountPercent = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
  const discountValue = Decimal(product.price)
    .mul(discountPercent)
    .div(100)
    .toDecimalPlaces(0);

  const discount = await prisma.dailyDiscount.create({
    data: {
      productId: product.id,
      discountPercent,
      discountValue,
      maxQuota: 10,
      usedQuota: 0,
      targetUserIds,
      dayKey: todayKey,
      isActive: true,
    },
  });

  console.log(`✅ Created discount ${discount.id} for product ${product.id}`);
  console.log(`🎯 Total Target Users: ${targetUserIds.length}`);
  console.log(`📅 DayKey: ${todayKey}`);
}

seedDailyDiscount()
  .then(() => process.exit(0))
  .catch(console.error);

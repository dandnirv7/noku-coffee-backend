import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@infra/database/prisma.service';
import { DailyDiscountService } from './daily-discount.service';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class DailyDiscountScheduler {
  private readonly logger = new Logger(DailyDiscountScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyDiscountService: DailyDiscountService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Jakarta' })
  async handleDailyGeneration() {
    const todayKey = new Date().toISOString().split('T')[0];

    const deactivated = await this.prisma.dailyDiscount.updateMany({
      where: { dayKey: { lt: todayKey }, isActive: true },
      data: { isActive: false },
    });
    this.logger.log(
      `Deactivated ${deactivated.count} expired daily discounts.`,
    );

    const allUsers = await this.prisma.user.findMany({ select: { id: true } });
    if (allUsers.length === 0) return;

    const targetUserIds = allUsers
      .sort(() => 0.5 - Math.random())
      .slice(0, 50)
      .map((u) => u.id);

    const availableProducts = await this.prisma.product.findMany({
      where: { stock: { gt: 0 }, deletedAt: null },
      select: { id: true, name: true, price: true },
    });
    if (availableProducts.length === 0) return;

    const selectedProducts = availableProducts
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const GLOBAL_QUOTA = 25;

    for (const product of selectedProducts) {
      const discountPercent = Math.floor(Math.random() * (20 - 5 + 1)) + 5;
      const discountValue = new Decimal(product.price)
        .mul(discountPercent)
        .div(100)
        .toDecimalPlaces(0);

      await this.dailyDiscountService.generateDailyDiscount(
        product.id,
        targetUserIds,
        discountValue.toNumber(),
        GLOBAL_QUOTA,
        todayKey,
        discountPercent,
      );

      this.logger.log(
        `✅ Generated ${discountPercent}% discount (~Rp${discountValue.toString()}) for Product ${product.name}`,
      );
    }

    this.logger.log('Daily discount generation completed.');
  }
}

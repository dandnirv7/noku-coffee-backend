import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';

@Injectable()
export class DailyDiscountService {
  private readonly logger = new Logger(DailyDiscountService.name);

  constructor(private prisma: PrismaService) {}

  async generateDailyDiscount(
    productId: string,
    targetUserIds: string[],
    discountValue: number,
    maxQuota: number,
    dayKey: string,
    discountPercent?: number,
  ) {
    const existing = await this.prisma.dailyDiscount.findUnique({
      where: { productId_dayKey: { productId, dayKey } },
    });

    if (existing) return existing;

    return this.prisma.dailyDiscount.create({
      data: {
        productId,
        discountValue,
        discountPercent,
        maxQuota,
        targetUserIds,
        dayKey,
        isActive: true,
      },
    });
  }

  async getApplicableDiscount(userId: string, productId: string) {
    const todayKey = new Date().toISOString().split('T')[0];

    const discount = await this.prisma.dailyDiscount.findUnique({
      where: {
        productId_dayKey: {
          productId,
          dayKey: todayKey,
        },
      },
    });

    if (!discount) return null;
    if (!discount.isActive) return null;

    if (discount.usedQuota >= discount.maxQuota) return null;

    if (
      discount.targetUserIds.length > 0 &&
      !discount.targetUserIds.includes(userId)
    ) {
      return null;
    }

    return discount;
  }

  async getTodayDiscount() {
    const todayKey = new Date().toISOString().split('T')[0];

    return this.prisma.dailyDiscount.findMany({
      where: {
        dayKey: todayKey,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            sku: true,
            type: true,
            images: true,
            origin: true,
            roastLevel: true,
            process: true,
            weight: true,
            stock: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async incrementUsage(
    discountId: string,
    quantity: number,
    maxQuota: number,
    tx?: PrismaService,
  ) {
    const prisma = tx || this.prisma;

    const result = await prisma.dailyDiscount.updateMany({
      where: {
        id: discountId,
        usedQuota: {
          lt: maxQuota,
        },
      },
      data: {
        usedQuota: { increment: quantity },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Daily discount quota has been reached');
    }

    return true;
  }
}

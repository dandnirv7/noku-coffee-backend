import { PrismaService } from '@infra/database/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { DiscountType } from 'generated/prisma/client';
import { ValidatePromoDto } from './dto/validate-promo.dto';

@Injectable()
export class PromoService {
  constructor(private readonly prisma: PrismaService) {}

  async validatePromo(userId: string, dto: ValidatePromoDto) {
    const { code, amount } = dto;
    const subtotal = new Decimal(amount);

    const promo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      throw new BadRequestException('Promo code is not valid');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Promo code is not active');
    }

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new BadRequestException('Promo code is expired');
    }

    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException('Promo code is expired');
    }

    if (promo.minOrderAmount && subtotal.lt(promo.minOrderAmount)) {
      throw new BadRequestException(
        `Promo code minimum order amount is ${promo.minOrderAmount}`,
      );
    }

    if (promo.usagePerUser) {
      const userUsage = await this.prisma.voucherUsage.count({
        where: { userId, promoCodeId: promo.id },
      });
      if (userUsage >= promo.usagePerUser) {
        throw new BadRequestException(
          'You have reached the maximum usage limit for this promo code',
        );
      }
    }

    let discountAmount = new Decimal(0);
    if (promo.type === DiscountType.FIXED) {
      discountAmount = promo.value;
    } else if (promo.type === DiscountType.PERCENTAGE) {
      discountAmount = subtotal.mul(promo.value).div(100);
      if (promo.maxDiscount && discountAmount.gt(promo.maxDiscount)) {
        discountAmount = promo.maxDiscount;
      }
    }

    if (discountAmount.gt(subtotal)) {
      discountAmount = subtotal;
    }

    return {
      isValid: true,
      code: promo.code,
      discountAmount: discountAmount.toNumber(),
      finalAmount: subtotal.sub(discountAmount).toNumber(),
      details: {
        type: promo.type,
        value: promo.value.toNumber(),
        maxDiscount: promo.maxDiscount?.toNumber(),
        minOrderAmount: promo.minOrderAmount?.toNumber(),
      },
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { DailyDiscountService } from './daily-discount.service';
import { DailyDiscount } from 'generated/prisma/client';

@Controller('daily-discounts')
export class DailyDiscountController {
  constructor(private readonly dailyDiscountService: DailyDiscountService) {}

  @Get('today')
  async getTodayDiscount(): Promise<DailyDiscount[] | { message: string }> {
    const discounts = await this.dailyDiscountService.getTodayDiscount();

    if (!discounts || discounts.length === 0) {
      return { message: 'No daily discount available today.' };
    }

    return discounts;
  }
}

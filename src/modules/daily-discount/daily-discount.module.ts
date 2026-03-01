import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DailyDiscountService } from './daily-discount.service';
import { DailyDiscountScheduler } from './daily-discount.scheduler';
import { DailyDiscountController } from './daily-discount.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DailyDiscountController],
  providers: [DailyDiscountService, DailyDiscountScheduler],
  exports: [DailyDiscountService],
})
export class DailyDiscountModule {}

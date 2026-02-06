import { PaymentService } from '@modules/payment/payment.service';
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderSchedulerService } from './order-scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [OrderService, OrderSchedulerService, PaymentService],
  exports: [OrderService, OrderSchedulerService, PaymentService],
  controllers: [OrderController],
})
export class OrderModule {}

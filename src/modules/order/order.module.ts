import { PaymentService } from '@modules/payment/payment.service';
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  providers: [OrderService, PaymentService],
  exports: [OrderService, PaymentService],
  controllers: [OrderController],
})
export class OrderModule {}

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { OrderService } from '@modules/order/order.service';

@Module({
  providers: [PaymentService, OrderService],
  exports: [PaymentService, OrderService],
  controllers: [PaymentController],
})
export class PaymentModule {}

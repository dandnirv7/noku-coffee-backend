import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import { CurrentUser } from '@infra/common/decorators/current-user.decorator';
import { UserSession } from '@thallesp/nestjs-better-auth';

@Controller('orders')
@UseGuards(AuthenticatedGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(@CurrentUser() user: UserSession['user']) {
    const order = await this.orderService.checkout(user.id);

    return {
      message: 'Order created successfully',
      data: order,
    };
  }

  @Get()
  async getHistory(@CurrentUser() user: UserSession['user']) {
    return {
      data: await this.orderService.getOrderHistory(user.id),
    };
  }
}

import { CurrentUser } from '@infra/common/decorators/current-user.decorator';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import { RolesGuard } from '@infra/common/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles, UserSession } from '@thallesp/nestjs-better-auth';
import { UserRole } from 'generated/prisma/enums';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderService } from './order.service';

@Controller('orders')
@UseGuards(AuthenticatedGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private readonly logger = new Logger(OrderController.name);

  @Post('checkout')
  async checkout(
    @CurrentUser() user: UserSession['user'],
    @Body() checkoutDto: CheckoutDto,
  ) {
    const order = await this.orderService.checkout(
      user.id,
      checkoutDto.addressId,
      checkoutDto.promoCode,
    );

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

  @Get(':id')
  async getOrderById(@Param('id') orderId: string) {
    return {
      data: await this.orderService.getOrderById(orderId),
    };
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: UserSession['user'],
    @Body('reason') reason: string,
  ) {
    return this.orderService.cancelByUser(user.id, id, reason);
  }

  @Post(':id/repay')
  async repayOrder(
    @Param('id') id: string,
    @CurrentUser() user: UserSession['user'],
  ) {
    return this.orderService.repay(user.id, id);
  }

  @Post(':id/refund-request')
  async requestRefund(
    @Param('id') id: string,
    @CurrentUser() user: UserSession['user'],
    @Body('reason') reason: string,
  ) {
    return this.orderService.requestRefund(user.id, id, reason);
  }

  @Roles([UserRole.ADMIN])
  @Post(':id/refund-approve')
  async approveRefund(@Param('id') id: string, @Body('notes') notes: string) {
    return this.orderService.processRefund(id, notes);
  }

  @Roles([UserRole.ADMIN])
  @Patch(':id/manual-approve')
  async manualApprove(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserSession['user'],
  ) {
    this.logger.log(`Admin ${adminUser.email} manually approved order ${id}`);

    return this.orderService.markAsPaid(id);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infra/database/prisma.service';
import { OrderService } from './order.service';
import { OrderStatus } from 'generated/prisma/client';

@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'check-expired-orders',
    timeZone: 'Asia/Jakarta',
  })
  async handleExpiredOrders() {
    this.logger.log('Running Cron Job: Checking for expired orders...');

    const expirationMinutes = this.configService.get<number>(
      'ORDER_EXPIRATION_MINUTES',
      1450,
    );

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - expirationMinutes);

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          lt: expirationTime,
        },
      },
      select: { id: true, orderNumber: true },
      orderBy: {
        createdAt: 'asc',
      },
      take: this.BATCH_SIZE,
    });

    if (expiredOrders.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${expiredOrders.length} expired orders. Processing cancellations in parallel...`,
    );

    const results = await Promise.allSettled(
      expiredOrders.map(async (order) => {
        await this.orderService.markAsCancelled(
          order.id,
          'System Auto-Cancel: Payment time limit exceeded',
        );
        return order.orderNumber;
      }),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Job Complete. Success: ${successCount}, Failed: ${failedCount}`,
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Failed to cancel order ${expiredOrders[index].orderNumber}: ${result.reason}`,
        );
      }
    });

    /* NOTE FOR SCALABILITY:
      If this app scales to multiple instances (horizontal scaling), 
      this cron will run on every instance causing race conditions.
      
      Solution for production: 
      1. Use a distributed lock (e.g., Redis Lock).
      2. Or use a dedicated worker service (BullMQ).
      3. Or use Kubernetes CronJob calling an API endpoint.
    */
  }
}

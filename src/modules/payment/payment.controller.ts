import { XenditWebhookGuard } from '@infra/common/guards/xendit-webhook.guard';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { OrderStatus } from 'generated/prisma/client';
import { InvoiceCallback, InvoiceStatus } from 'xendit-node/invoice/models';
import { OrderService } from '../order/order.service';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) {}

  private readonly logger = new Logger(PaymentController.name);

  @AllowAnonymous()
  @UseGuards(XenditWebhookGuard)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleInvoiceCallback(
    @Body() body: InvoiceCallback & { external_id?: string; id?: string },
  ) {
    const orderId = body.external_id || body.externalId;
    const incomingStatus = body.status;
    const xenditInvoiceId = body.id;

    if (!xenditInvoiceId) {
      return { status: 'ignored_invalid_payload' };
    }

    if (orderId) {
      const currentStatus = await this.orderService.getOrderStatus(orderId);

      if (currentStatus === OrderStatus.PAID) {
        return { status: 'ignored_already_paid' };
      }

      if (currentStatus === OrderStatus.CANCELLED) {
        return { status: 'ignored_cancelled' };
      }

      await this.orderService.createPaymentLog(orderId, incomingStatus, body);

      this.logger.log(`invoice status: ${InvoiceStatus}`);

      try {
        if (incomingStatus === InvoiceStatus.Paid) {
          const realInvoice =
            await this.paymentService.getInvoiceById(xenditInvoiceId);

          if (realInvoice.status !== InvoiceStatus.Paid) {
            this.logger.error(
              `Fraud attempt detected for ${orderId}. Payload: PAID, Real: ${realInvoice.status}`,
            );
            return { status: 'rejected_mismatch' };
          }
        }

        switch (incomingStatus) {
          case InvoiceStatus.Paid:
            await this.orderService.markAsPaid(orderId);
            this.logger.log(`Order ${orderId} marked as PAID`);
            break;

          case InvoiceStatus.Expired:
            await this.orderService.markAsCancelled(
              orderId,
              'Xendit Invoice Expired',
            );
            this.logger.log(`Order ${orderId} marked as CANCELLED`);
            break;
        }
      } catch (error) {
        this.logger.error(
          `Failed to process webhook for ${orderId}: ${error.message}`,
        );

        if (error instanceof BadRequestException) {
          return { status: 'ignored_bad_state' };
        }

        throw error;
      }
    }

    return { status: 'success' };
  }
}

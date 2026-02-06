import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Xendit } from 'xendit-node';
import {
  CreateInvoiceRequest,
  Invoice as XenditInvoice,
} from 'xendit-node/invoice/models';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class PaymentService {
  private xenditClient: Xendit;

  constructor(private configService: ConfigService) {
    this.xenditClient = new Xendit({
      secretKey: this.configService.get<string>('XENDIT_SECRET_KEY'),
    });
  }

  async createInvoice(payload: CreateInvoiceDto & { orderNumber: string }) {
    const {
      orderId,
      amount,
      invoiceDuration,
      customer,
      items,
      fees,
      metadata,
    } = payload;

    const { email, givenNames, surname, phoneNumber, mobileNumber, addresses } =
      customer;

    const paymentDescription = `Noku Coffee - Pesanan #${payload.orderNumber}`;

    const data: CreateInvoiceRequest = {
      externalId: orderId,
      amount,
      payerEmail: email,
      description: paymentDescription,
      invoiceDuration: invoiceDuration ?? 86400,
      currency: 'IDR',
      reminderTime: 1,

      customer: {
        email,
        givenNames,
        surname,
        phoneNumber,
        mobileNumber,
        addresses,
      },

      customerNotificationPreference: {
        invoiceCreated: ['email'],
        invoiceReminder: ['email'],
        invoicePaid: ['email'],
      },

      items,
      fees,

      metadata: {
        orderId,
        ...metadata,
      },
    };

    return this.xenditClient.Invoice.createInvoice({ data });
  }

  async getInvoiceById(invoiceId: string): Promise<XenditInvoice> {
    try {
      return await this.xenditClient.Invoice.getInvoiceById({ invoiceId });
    } catch (error) {
      // Handle jika invoice tidak ditemukan di Xendit
      throw new Error(`Xendit Invoice Check Failed: ${error.message}`);
    }
  }
}

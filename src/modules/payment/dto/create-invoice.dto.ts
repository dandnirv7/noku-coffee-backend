import { CreateInvoiceRequest } from 'xendit-node/invoice/models';

export interface CreateInvoiceDto {
  orderId: string;
  amount: number;
  customer: {
    email: string;
    givenNames?: string;
    surname?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    addresses?: CreateInvoiceRequest['customer']['addresses'];
  };
  items?: CreateInvoiceRequest['items'];
  fees?: CreateInvoiceRequest['fees'];
  description?: string;
  invoiceDuration?: number;
  metadata?: Record<string, string>;
}

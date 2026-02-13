import {
  TransactionType,
  TransactionStatus,
  ChannelCategory,
  Currency,
} from './list-transactions.dto';

export enum Cashflow {
  MONEY_IN = 'MONEY_IN',
  MONEY_OUT = 'MONEY_OUT',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  EARLY_SETTLED = 'EARLY_SETTLED',
  SETTLED = 'SETTLED',
}

export enum FeeStatus {
  COMPLETED = 'COMPLETED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export class TransactionFeeDto {
  xenditFee: number;
  valueAddedTax: number;
  xenditWithholdingTax: number;
  thirdPartyWithholdingTax: number;
  status: FeeStatus;
}

export class ProductDataDto {
  captureId?: string;
  paymentRequestId?: string;
  reusablePaymentLinkId?: string;
  invoiceId?: string;
  orderNumber?: string;
}

export interface TransactionItemDto {
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
    sku: string;
  };
}

export interface TransactionDto {
  id: string;
  productId: string;
  type: TransactionType;
  status: TransactionStatus;
  channelCategory: ChannelCategory;
  channelCode: string;
  referenceId: string;
  accountIdentifier?: string | null;
  currency: Currency;
  amount: number;
  netAmount: number;
  netAmountCurrency: Currency;
  cashflow: Cashflow;

  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  promoCode?: string;

  settlementStatus?: SettlementStatus | null;
  estimatedSettlementTime?: string | null;
  businessId: string;
  created: string;
  updated: string;
  fee: TransactionFeeDto;
  productData?: ProductDataDto;
  orderNumber: string;
  items: TransactionItemDto[];
}

export class PaginationLinkDto {
  href: string;
  rel: string;
  method: string;
}

export class TransactionListResponseDto {
  hasMore: boolean;
  data: TransactionDto[];
  links?: PaginationLinkDto[];
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Xendit } from 'xendit-node';
import {
  ListTransactionsDto,
  TransactionDto,
  TransactionListResponseDto,
  TransactionFeeDto,
  ProductDataDto,
  Cashflow,
  SettlementStatus,
  FeeStatus,
  TransactionType,
  TransactionStatus,
  ChannelCategory,
  Currency,
} from './dto';
import { PrismaService } from '@infra/database/prisma.service';

interface XenditApiError {
  status?: number;
  message?: string;
  errorCode?: string;
}

interface XenditRawTransaction {
  id: string;
  product_id: string;
  type: string;
  status: string;
  channel_category: string;
  channel_code: string;
  reference_id: string;
  account_identifier?: string | null;
  currency: string;
  amount: number;
  net_amount: number;
  net_amount_currency: string;
  cashflow: string;
  settlement_status?: string | null;
  estimated_settlement_time?: string | null;
  business_id: string;
  created: string;
  updated: string;
  fee: {
    xendit_fee: number;
    value_added_tax: number;
    xendit_withholding_tax: number;
    third_party_withholding_tax: number;
    status: string;
  };
  product_data?: {
    capture_id?: string;
    payment_request_id?: string;
    reusable_payment_link_id?: string;
    invoice_id?: string;
  };
}

interface XenditRawListResponse {
  has_more: boolean;
  data: XenditRawTransaction[];
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly xenditClient: Xendit;
  private readonly baseUrl = 'https://api.xendit.co';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');

    if (!secretKey) {
      this.logger.error('XENDIT_SECRET_KEY is not configured');
      throw new Error('XENDIT_SECRET_KEY environment variable is required');
    }

    this.xenditClient = new Xendit({ secretKey });
  }

  async listTransactions(
    params: ListTransactionsDto,
  ): Promise<TransactionListResponseDto> {
    try {
      const queryParams = this.buildQueryParams(params);
      const url = `${this.baseUrl}/transactions${queryParams}`;

      this.logger.debug(`Fetching transactions: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildAuthHeaders(),
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const rawData = (await response.json()) as XenditRawListResponse;
      return this.mapListResponse(rawData);
    } catch (error) {
      this.handleError(error, 'Failed to fetch transactions');
    }
  }

  async getTransactionById(transactionId: string): Promise<TransactionDto> {
    try {
      const url = `${this.baseUrl}/transactions/${transactionId}`;

      this.logger.debug(`Fetching transaction: ${transactionId}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundException(
            `Transaction with ID '${transactionId}' not found`,
          );
        }
        await this.handleApiError(response);
      }

      const rawData = (await response.json()) as XenditRawTransaction;

      const order = (await this.prisma.order.findFirst({
        where: {
          OR: [
            { id: rawData.reference_id },
            { paymentExternalId: rawData.reference_id },
          ],
        },
        include: {
          items: true,
        },
      })) as any;

      const order_item = await this.prisma.orderItem.findMany({
        where: {
          OR: [{ orderId: rawData.reference_id }],
        },
      });

      const subtotalItem = order_item.reduce((price, item) => {
        return price + item.quantity * Number(item.priceAtPurchase);
      }, 0);

      const transaction = this.mapTransaction(rawData);

      if (order && order.items) {
        transaction.items = order.items.map((item) => ({
          productId: item.productId || '',
          quantity: item.quantity,
          product: {
            name: item.productNameSnapshot,
            price: item.priceAtPurchase.toNumber(),
            sku: item.productSkuSnapshot,
            subtotal_item: item.quantity * Number(item.priceAtPurchase),
          },
        }));

        transaction.subtotal = order.subtotal?.toNumber() || 0;
        transaction.shippingCost = order.shippingCost?.toNumber() || 0;
        transaction.taxAmount = order.taxAmount?.toNumber() || 0;
        transaction.discountAmount = order.discountAmount?.toNumber() || 0;
        transaction.orderNumber = order.orderNumber;
        transaction.promoCode = order.promoCodeId ? 'PROMO' : undefined;
      }

      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.handleError(error, `Failed to fetch transaction ${transactionId}`);
    }
  }

  private buildAuthHeaders(): Record<string, string> {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    const authToken = Buffer.from(`${secretKey}:`).toString('base64');

    return {
      Authorization: `Basic ${authToken}`,
      'Content-Type': 'application/json',
    };
  }

  private buildQueryParams(params: ListTransactionsDto): string {
    const searchParams = new URLSearchParams();

    if (params.types?.length) {
      params.types.forEach((type) => searchParams.append('types', type));
    }

    if (params.statuses?.length) {
      params.statuses.forEach((status) =>
        searchParams.append('statuses', status),
      );
    }

    if (params.channelCategories?.length) {
      params.channelCategories.forEach((category) =>
        searchParams.append('channel_categories', category),
      );
    }

    if (params.referenceId) {
      searchParams.append('reference_id', params.referenceId);
    }

    if (params.productId) {
      searchParams.append('product_id', params.productId);
    }

    if (params.accountIdentifier) {
      searchParams.append('account_identifier', params.accountIdentifier);
    }

    if (params.currency) {
      searchParams.append('currency', params.currency);
    }

    if (params.amount !== undefined) {
      searchParams.append('amount', params.amount.toString());
    }

    if (params.createdAfter) {
      searchParams.append('created[gte]', params.createdAfter);
    }

    if (params.createdBefore) {
      searchParams.append('created[lte]', params.createdBefore);
    }

    if (params.updatedAfter) {
      searchParams.append('updated[gte]', params.updatedAfter);
    }

    if (params.updatedBefore) {
      searchParams.append('updated[lte]', params.updatedBefore);
    }

    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    if (params.afterId) {
      searchParams.append('after_id', params.afterId);
    }

    if (params.beforeId) {
      searchParams.append('before_id', params.beforeId);
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private mapListResponse(
    raw: XenditRawListResponse,
  ): TransactionListResponseDto {
    return {
      hasMore: raw.has_more,
      data: raw.data.map((tx) => this.mapTransaction(tx)),
      links: raw.links?.map((link) => ({
        href: link.href,
        rel: link.rel,
        method: link.method,
      })),
    };
  }

  private mapTransaction(raw: XenditRawTransaction): TransactionDto {
    const fee: TransactionFeeDto = {
      xenditFee: raw.fee.xendit_fee,
      valueAddedTax: raw.fee.value_added_tax,
      xenditWithholdingTax: raw.fee.xendit_withholding_tax,
      thirdPartyWithholdingTax: raw.fee.third_party_withholding_tax,
      status: raw.fee.status as FeeStatus,
    };

    let productData: ProductDataDto | undefined;
    if (raw.product_data) {
      productData = {
        captureId: raw.product_data.capture_id,
        paymentRequestId: raw.product_data.payment_request_id,
        reusablePaymentLinkId: raw.product_data.reusable_payment_link_id,
        invoiceId: raw.product_data.invoice_id,
      };
    }

    return {
      id: raw.id,
      productId: raw.product_id,
      type: raw.type as TransactionType,
      status: raw.status as TransactionStatus,
      channelCategory: raw.channel_category as ChannelCategory,
      channelCode: raw.channel_code,
      referenceId: raw.reference_id,
      accountIdentifier: raw.account_identifier,
      currency: raw.currency as Currency,
      amount: raw.amount,
      netAmount: raw.net_amount,
      netAmountCurrency: raw.net_amount_currency as Currency,
      cashflow: raw.cashflow as Cashflow,
      settlementStatus: raw.settlement_status as SettlementStatus | null,
      estimatedSettlementTime: raw.estimated_settlement_time,
      businessId: raw.business_id,
      created: raw.created,
      updated: raw.updated,
      fee,
      productData,
      items: [],
      orderNumber: '',

      subtotal: 0,
      shippingCost: 0,
      taxAmount: 0,
      discountAmount: 0,
    };
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorData: XenditApiError = {};

    try {
      errorData = (await response.json()) as XenditApiError;
    } catch {}
    const message =
      errorData.message || `Xendit API error: ${response.statusText}`;

    this.logger.error(
      `Xendit API error: ${response.status} - ${message}`,
      errorData,
    );

    throw new HttpException(
      {
        statusCode: response.status,
        message,
        errorCode: errorData.errorCode,
      },
      response.status,
    );
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    this.logger.error(`${context}: ${errorMessage}`, error);

    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `${context}: ${errorMessage}`,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

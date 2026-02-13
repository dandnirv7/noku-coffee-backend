import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TransactionController } from './transaction.controller';
import { XenditService } from './xendit.service';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import {
  TransactionType,
  TransactionStatus,
  ChannelCategory,
  Currency,
  Cashflow,
  SettlementStatus,
  FeeStatus,
  TransactionDto,
  TransactionListResponseDto,
} from './dto';

const mockTransactionDto: TransactionDto = {
  id: 'txn_pay_1234567890abcdef',
  productId: 'py-123e4567-e89b-12d3-a456-426614174000',
  type: TransactionType.PAYMENT,
  status: TransactionStatus.SUCCESS,
  channelCategory: ChannelCategory.EWALLET,
  channelCode: 'ID_SHOPEEPAY',
  referenceId: 'payref-123456',
  accountIdentifier: null,
  currency: Currency.IDR,
  amount: 100000,
  netAmount: 99000,
  netAmountCurrency: Currency.IDR,
  cashflow: Cashflow.MONEY_IN,
  settlementStatus: SettlementStatus.SETTLED,
  estimatedSettlementTime: '2025-06-01T10:00:00Z',
  businessId: '1234567890abcdef',
  created: '2025-06-01T09:59:00Z',
  updated: '2025-06-01T10:01:00Z',
  fee: {
    xenditFee: 1000,
    valueAddedTax: 0,
    xenditWithholdingTax: 0,
    thirdPartyWithholdingTax: 0,
    status: FeeStatus.COMPLETED,
  },
  productData: {
    captureId: 'cap-123',
    paymentRequestId: 'pr-456',
  },
  items: [],
  orderNumber: 'ORD-2026-001',
  subtotal: 100000,
  shippingCost: 0,
  taxAmount: 0,
  discountAmount: 0,
  promoCode: '',
};

const mockListResponse: TransactionListResponseDto = {
  hasMore: false,
  data: [mockTransactionDto],
  links: [],
};

const mockGuard = { canActivate: () => true };

describe('TransactionController', () => {
  let controller: TransactionController;
  let xenditService: jest.Mocked<XenditService>;

  beforeEach(async () => {
    const mockXenditService = {
      listTransactions: jest.fn(),
      getTransactionById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: XenditService,
          useValue: mockXenditService,
        },
      ],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue(mockGuard)
      .overrideGuard(ThrottlerGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<TransactionController>(TransactionController);
    xenditService = module.get<XenditService>(
      XenditService,
    ) as jest.Mocked<XenditService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listTransactions', () => {
    it('should return paginated transactions', async () => {
      xenditService.listTransactions.mockResolvedValueOnce(mockListResponse);

      const result = await controller.listTransactions({ limit: 10 });

      expect(result).toEqual(mockListResponse);
      expect(xenditService.listTransactions).toHaveBeenCalledWith({
        limit: 10,
      });
    });

    it('should pass filter parameters to service', async () => {
      xenditService.listTransactions.mockResolvedValueOnce(mockListResponse);

      const params = {
        types: [TransactionType.PAYMENT],
        statuses: [TransactionStatus.SUCCESS],
        channelCategories: [ChannelCategory.EWALLET],
        currency: Currency.IDR,
        limit: 20,
      };

      await controller.listTransactions(params);

      expect(xenditService.listTransactions).toHaveBeenCalledWith(params);
    });

    it('should handle pagination parameters', async () => {
      xenditService.listTransactions.mockResolvedValueOnce({
        ...mockListResponse,
        hasMore: true,
      });

      const params = {
        limit: 10,
        afterId: 'txn_previous123',
      };

      const result = await controller.listTransactions(params);

      expect(result.hasMore).toBe(true);
      expect(xenditService.listTransactions).toHaveBeenCalledWith(params);
    });

    it('should handle empty results', async () => {
      xenditService.listTransactions.mockResolvedValueOnce({
        hasMore: false,
        data: [],
        links: [],
      });

      const result = await controller.listTransactions({ limit: 10 });

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction details by Order Number', async () => {
      xenditService.getTransactionById.mockResolvedValueOnce(
        mockTransactionDto,
      );
      const result = await controller.getTransaction('ORD-2026-001');

      expect(result).toEqual(mockTransactionDto);
      expect(xenditService.getTransactionById).toHaveBeenCalledWith(
        'ORD-2026-001',
      );
    });

    it('should propagate NotFoundException from service', async () => {
      xenditService.getTransactionById.mockRejectedValueOnce(
        new NotFoundException('Transaction not found'),
      );

      await expect(controller.getTransaction('ORD-UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return transaction with product data', async () => {
      const txWithProductData: TransactionDto = {
        ...mockTransactionDto,
        productData: {
          captureId: 'cap-123',
          paymentRequestId: 'pr-456',
        },
      };

      xenditService.getTransactionById.mockResolvedValueOnce(txWithProductData);

      const result = await controller.getTransaction('ORD-2026-001');

      expect(result.productData?.captureId).toBe('cap-123');
      expect(result.productData?.paymentRequestId).toBe('pr-456');
    });
  });
});

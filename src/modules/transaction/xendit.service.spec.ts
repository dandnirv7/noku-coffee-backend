import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';
import { XenditService } from './xendit.service';
import {
  TransactionType,
  TransactionStatus,
  ChannelCategory,
  Currency,
} from './dto';

const mockTransaction = {
  id: 'txn_pay_1234567890abcdef',
  product_id: 'py-123e4567-e89b-12d3-a456-426614174000',
  type: 'PAYMENT',
  status: 'SUCCESS',
  channel_category: 'EWALLET',
  channel_code: 'ID_SHOPEEPAY',
  reference_id: 'payref-123456',
  account_identifier: null,
  currency: 'IDR',
  amount: 100000,
  net_amount: 99000,
  net_amount_currency: 'IDR',
  cashflow: 'MONEY_IN',
  settlement_status: 'SETTLED',
  estimated_settlement_time: '2025-06-01T10:00:00Z',
  business_id: '1234567890abcdef',
  created: '2025-06-01T09:59:00Z',
  updated: '2025-06-01T10:01:00Z',
  fee: {
    xendit_fee: 1000,
    value_added_tax: 0,
    xendit_withholding_tax: 0,
    third_party_withholding_tax: 0,
    status: 'COMPLETED',
  },
  product_data: {
    capture_id: 'cap-123',
    payment_request_id: 'pr-456',
  },
};

const mockListResponse = {
  has_more: false,
  data: [mockTransaction],
  links: [],
};

const mockOrder = {
  id: 'payref-123456',
  paymentExternalId: 'payref-123456',
  subtotal: { toNumber: () => 100000 },
  shippingCost: { toNumber: () => 10000 },
  taxAmount: { toNumber: () => 11000 },
  discountAmount: { toNumber: () => 5000 },
  orderNumber: 'ORD-001',
  promoCodeId: 'PROMO-123',
  items: [
    {
      productId: 'prod-1',
      quantity: 2,
      productNameSnapshot: 'Product A',
      priceAtPurchase: { toNumber: () => 50000 },
      productSkuSnapshot: 'SKU-A',
    },
  ],
};

const mockOrderItems = [
  {
    quantity: 2,
    priceAtPurchase: 50000,
  },
];

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPrismaService = {
  order: {
    findFirst: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
  },
};

describe('XenditService', () => {
  let service: XenditService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockSecretKey = 'xnd_development_test_secret_key_123';

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockFetch.mockReset();
    mockPrismaService.order.findFirst.mockReset();
    mockPrismaService.orderItem.findMany.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XenditService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'XENDIT_SECRET_KEY') return mockSecretKey;
              return undefined;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<XenditService>(XenditService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if XENDIT_SECRET_KEY is not configured', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            XenditService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn(() => undefined),
              },
            },
            { provide: PrismaService, useValue: mockPrismaService },
          ],
        }).compile(),
      ).rejects.toThrow('XENDIT_SECRET_KEY environment variable is required');
    });
  });

  describe('listTransactions', () => {
    it('should return paginated transactions successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      const result = await service.listTransactions({ limit: 10 });

      expect(result.hasMore).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockTransaction.id);
      expect(result.data[0].type).toBe(TransactionType.PAYMENT);
      expect(result.data[0].status).toBe(TransactionStatus.SUCCESS);
    });

    it('should build correct query params for filtering', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockListResponse,
      });

      await service.listTransactions({
        types: [TransactionType.PAYMENT],
        statuses: [TransactionStatus.SUCCESS],
        channelCategories: [ChannelCategory.EWALLET],
        currency: Currency.IDR,
        limit: 20,
      });

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain('types=PAYMENT');
      expect(url).toContain('statuses=SUCCESS');
      expect(url).toContain('channel_categories=EWALLET');
      expect(url).toContain('currency=IDR');
      expect(url).toContain('limit=20');
    });

    it('should throw HttpException on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          message: 'Invalid parameters',
          errorCode: 'VALIDATION_ERROR',
        }),
      });

      await expect(service.listTransactions({ limit: 10 })).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction details by ID successfully (without enrichment)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      });

      mockPrismaService.order.findFirst.mockResolvedValue(null);
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);

      const result = await service.getTransactionById(mockTransaction.id);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/transactions/${mockTransaction.id}`),
        expect.objectContaining({
          headers: expect.anything(),
        }),
      );

      expect(result.id).toBe(mockTransaction.id);
      expect(result.items).toHaveLength(0);
      expect(result.orderNumber).toBe('');
    });

    it('should enrich transaction data when order exists in Prisma', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      });
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaService.orderItem.findMany.mockResolvedValue(mockOrderItems);

      const result = await service.getTransactionById(mockTransaction.id);

      expect(result.id).toBe(mockTransaction.id);
      expect(result.orderNumber).toBe(mockOrder.orderNumber);
      expect(result.promoCode).toBe('PROMO');

      expect(result.subtotal).toBe(100000);
      expect(result.shippingCost).toBe(10000);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod-1');
      expect(result.items[0].product.name).toBe('Product A');
      expect(result.items[0].product.price).toBe(50000);
    });

    it('should throw NotFoundException when API returns 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Transaction not found' }),
      });

      await expect(
        service.getTransactionById('txn_nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw HttpException on other API errors (e.g., 500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Internal error' }),
      });

      await expect(service.getTransactionById('txn_error')).rejects.toThrow(
        HttpException,
      );
    });

    it('should include correct authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      });

      mockPrismaService.order.findFirst.mockResolvedValue(null);
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);

      await service.getTransactionById('txn_123');

      const fetchCall = mockFetch.mock.calls[0];
      const options = fetchCall[1] as RequestInit;
      const authHeader = (options.headers as Record<string, string>)[
        'Authorization'
      ];

      const expectedAuth = `Basic ${Buffer.from(`${mockSecretKey}:`).toString('base64')}`;
      expect(authHeader).toBe(expectedAuth);
    });
  });
});

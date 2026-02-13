import { Test, TestingModule } from '@nestjs/testing';
import { PromoService } from './promo.service';
import { PrismaService } from '@infra/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DiscountType } from 'generated/prisma/client';
import { Decimal } from 'generated/prisma/internal/prismaNamespace';

describe('PromoService', () => {
  let service: PromoService;
  let prisma: PrismaService;

  const mockDate = new Date('2024-01-01T10:00:00Z');
  const validPromoCode = {
    id: 'promo-123',
    code: 'SUMMER2024',
    isActive: true,
    startDate: new Date('2023-01-01'),
    endDate: new Date('2025-01-01'),
    usageLimit: 100,
    usageCount: 0,
    minOrderAmount: new Decimal(50000),
    usagePerUser: 1,
    type: DiscountType.FIXED,
    value: new Decimal(10000),
    maxDiscount: null,
  };

  const mockPrisma = {
    promoCode: {
      findUnique: jest.fn(),
    },
    voucherUsage: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PromoService>(PromoService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();

    jest.useFakeTimers().setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validatePromo', () => {
    it('should validate and apply FIXED discount correctly', async () => {
      mockPrisma.promoCode.findUnique.mockResolvedValue(validPromoCode);
      mockPrisma.voucherUsage.count.mockResolvedValue(0);

      const result = await service.validatePromo('user-1', {
        code: 'SUMMER2024',
        amount: 100000,
      });

      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(10000);
      expect(result.finalAmount).toBe(90000);
    });

    it('should validate and apply PERCENTAGE discount with max cap', async () => {
      const percentagePromo = {
        ...validPromoCode,
        type: DiscountType.PERCENTAGE,
        value: new Decimal(50),
        maxDiscount: new Decimal(20000),
      };
      mockPrisma.promoCode.findUnique.mockResolvedValue(percentagePromo);
      mockPrisma.voucherUsage.count.mockResolvedValue(0);

      const result = await service.validatePromo('user-1', {
        code: 'SUMMER2024',
        amount: 100000,
      });

      expect(result.discountAmount).toBe(20000);
      expect(result.finalAmount).toBe(80000);
    });

    it('should ensure discount does not exceed subtotal', async () => {
      const hugeDiscountPromo = {
        ...validPromoCode,
        value: new Decimal(200000),
      };
      mockPrisma.promoCode.findUnique.mockResolvedValue(hugeDiscountPromo);
      mockPrisma.voucherUsage.count.mockResolvedValue(0);
      const result = await service.validatePromo('user-1', {
        code: 'SUMMER2024',
        amount: 100000,
      });

      expect(result.discountAmount).toBe(100000);
      expect(result.finalAmount).toBe(0);
    });

    it('should throw BadRequest if promo code not found', async () => {
      mockPrisma.promoCode.findUnique.mockResolvedValue(null);

      await expect(
        service.validatePromo('user-1', { code: 'INVALID', amount: 100000 }),
      ).rejects.toThrow(new BadRequestException('Promo code is not valid'));
    });

    it('should throw BadRequest if promo is expired (date)', async () => {
      const expiredPromo = {
        ...validPromoCode,
        endDate: new Date('2020-01-01'),
      };
      mockPrisma.promoCode.findUnique.mockResolvedValue(expiredPromo);

      await expect(
        service.validatePromo('user-1', { code: 'SUMMER2024', amount: 100000 }),
      ).rejects.toThrow(new BadRequestException('Promo code is expired'));
    });

    it('should throw BadRequest if global usage limit reached', async () => {
      const limitedPromo = {
        ...validPromoCode,
        usageLimit: 10,
        usageCount: 10,
      };
      mockPrisma.promoCode.findUnique.mockResolvedValue(limitedPromo);

      await expect(
        service.validatePromo('user-1', { code: 'SUMMER2024', amount: 100000 }),
      ).rejects.toThrow(new BadRequestException('Promo code is expired'));
    });

    it('should throw BadRequest if minimum order amount not met', async () => {
      mockPrisma.promoCode.findUnique.mockResolvedValue(validPromoCode);

      await expect(
        service.validatePromo('user-1', {
          code: 'SUMMER2024',
          amount: 40000,
        }),
      ).rejects.toThrow(
        new BadRequestException('Promo code minimum order amount is 50000'),
      );
    });

    it('should throw BadRequest if user usage limit reached', async () => {
      mockPrisma.promoCode.findUnique.mockResolvedValue(validPromoCode);
      mockPrisma.voucherUsage.count.mockResolvedValue(1);

      await expect(
        service.validatePromo('user-1', { code: 'SUMMER2024', amount: 100000 }),
      ).rejects.toThrow(
        new BadRequestException(
          'You have reached the maximum usage limit for this promo code',
        ),
      );
    });
  });
});

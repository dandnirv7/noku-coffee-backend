import { Test, TestingModule } from '@nestjs/testing';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';

describe('PromoController', () => {
  let controller: PromoController;
  let service: PromoService;

  const mockPromoService = {
    validatePromo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoController],
      providers: [
        {
          provide: PromoService,
          useValue: mockPromoService,
        },
      ],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PromoController>(PromoController);
    service = module.get<PromoService>(PromoService);
  });

  it('should call service.validatePromo with correct params', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' } as any;
    const dto: ValidatePromoDto = {
      code: 'TESTCODE',
      amount: 100000,
    };

    const expectedResult = {
      isValid: true,
      code: 'TESTCODE',
      discountAmount: 10000,
      finalAmount: 90000,
      details: {} as any,
    };

    mockPromoService.validatePromo.mockResolvedValue(expectedResult);

    const result = await controller.validate(mockUser, dto);

    expect(service.validatePromo).toHaveBeenCalledWith(mockUser.id, dto);
    expect(result).toEqual(expectedResult);
  });
});

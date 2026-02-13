import { CurrentUser } from '@infra/common/decorators/current-user.decorator';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { PromoService } from './promo.service';

@Controller('promos')
@UseGuards(AuthenticatedGuard)
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post('validate')
  async validate(
    @CurrentUser() user: UserSession['user'],
    @Body() dto: ValidatePromoDto,
  ) {
    return this.promoService.validatePromo(user.id, dto);
  }
}

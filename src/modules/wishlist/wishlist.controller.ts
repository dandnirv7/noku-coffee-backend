import { CurrentUser } from '@infra/common/decorators/current-user.decorator';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import { ParseCuidPipe } from '@infra/common/pipes/parse-cuid.pipe';
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@UseGuards(AuthenticatedGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':productId')
  async toggle(
    @CurrentUser() user: UserSession['user'],
    @Param('productId', ParseCuidPipe) productId: string,
  ) {
    const result = await this.wishlistService.toggleWishlist(
      user.id,
      productId,
    );

    return {
      message: result.isAdded ? 'Added to wishlist' : 'Removed from wishlist',
      data: result,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: UserSession['user']) {
    return {
      data: await this.wishlistService.getWishlist(user.id),
    };
  }
}

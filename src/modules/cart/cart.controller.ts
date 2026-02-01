import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Session,
  UseGuards,
} from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import { CurrentUser } from '@infra/common/decorators/current-user.decorator';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(AuthenticatedGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addToCart(
    @CurrentUser() user: UserSession['user'],
    @Body() dto: AddToCartDto,
  ) {
    return {
      message: 'Item added to cart',
      data: await this.cartService.addToCart(user.id, dto),
    };
  }

  @Get()
  async getCart(@CurrentUser() user: UserSession['user']) {
    const cart = await this.cartService.getCart(user.id);
    return {
      data: cart,
    };
  }

  @Patch(':productId')
  async updateQuantity(
    @CurrentUser() user: UserSession['user'],
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const updatedCartItem = await this.cartService.updateQuantity(
      user.id,
      productId,
      dto,
    );
    return {
      message: 'Cart updated',
      data: updatedCartItem,
    };
  }

  @Delete(':productId')
  async removeItem(
    @CurrentUser() user: UserSession['user'],
    @Param('productId') productId: string,
  ) {
    const deletedCartItem = await this.cartService.removeItem(
      user.id,
      productId,
    );
    return {
      message: 'Item removed from cart',
      data: deletedCartItem,
    };
  }

  @Delete()
  async clearCart(@CurrentUser() user: UserSession['user']) {
    const deletedCartItem = await this.cartService.clearCart(user.id);
    return {
      message: 'Cart cleared',
      data: deletedCartItem,
    };
  }
}

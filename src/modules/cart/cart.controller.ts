import { Body, Controller, Get, Post, Session } from '@nestjs/common';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addToCart(@Session() session: UserSession, @Body() dto: AddToCartDto) {
    return {
      message: 'Item added to cart',
      data: await this.cartService.addToCart(session.user.id, dto),
    };
  }

  @Get()
  async getCart(@Session() session: UserSession) {
    return {
      data: await this.cartService.getCart(session.user.id),
    };
  }
}

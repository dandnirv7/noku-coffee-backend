import { PrismaService } from '@infra/database/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from 'generated/prisma/client';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addToCart(userId: string, dto: AddToCartDto) {
    const { productId, quantity } = dto;

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.$queryRaw<Product[]>`
        SELECT * FROM "product"
        WHERE id = ${productId}
        FOR UPDATE
      `;

      const product = products[0];

      if (!product || product.deletedAt) {
        throw new NotFoundException('Product not found');
      }

      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: (await tx.cart.findUnique({ where: { userId } }))?.id,
          productId,
        },
      });

      const cart = await tx.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      const currentQty = existingItem?.quantity || 0;
      if (currentQty + quantity > product.stock) {
        throw new BadRequestException('Insufficient Stock');
      }

      return tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        update: {
          quantity: currentQty + quantity,
        },
        create: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    });
  }

  async getCart(userId: string) {
    const cart = await this.prisma.extended.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      return { items: [], total: 0 };
    }

    const items = cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: Number(item.product.price),
      },
    }));

    const total = items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );

    return { ...cart, items, total };
  }

  async updateQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const products = await tx.$queryRaw<Product[]>`
        SELECT * FROM "product" WHERE id = ${productId} FOR UPDATE
      `;

      const product = products[0];

      if (!product || product.deletedAt)
        throw new NotFoundException('Product not found');

      if (dto.quantity > product.stock)
        throw new BadRequestException('Insufficient stock');

      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) throw new NotFoundException('Cart not found');

      const updatedCartItem = await tx.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        data: {
          quantity: dto.quantity,
        },
      });

      return updatedCartItem;
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) throw new NotFoundException('Cart not found');

    const deletedCartItem = await this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    return deletedCartItem;
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) throw new NotFoundException('Cart not found');

    const deletedCartItem = await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return deletedCartItem;
  }
}

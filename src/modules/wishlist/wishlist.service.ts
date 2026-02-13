import { PrismaService } from '@infra/database/prisma.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(WishlistService.name);

  async toggleWishlist(userId: string, productId: string) {
    try {
      const product = await this.prisma.extended.product.findUnique({
        where: {
          id: productId,
          deletedAt: null,
        },
      });

      if (!product) throw new NotFoundException('Product not found');

      const existingItem = await this.prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (existingItem) {
        await this.prisma.wishlistItem.delete({
          where: { id: existingItem.id },
        });
        return { isAdded: false };
      }

      await this.prisma.wishlistItem.create({
        data: { userId, productId },
      });

      return { isAdded: true };
    } catch (error) {
      this.logger.error(`Failed to toggle wishlist: ${error.message}`);
      throw error;
    }
  }

  async getWishlist(userId: string) {
    const products = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const category = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const items = products.map((item) => {
      return {
        ...item,
        product: {
          ...item.product,
          categoryId: item.product.categoryId,
          category: category.find((c) => c.id === item.product.categoryId),
        },
      };
    });

    return items;
  }
}

import { PrismaService } from '@infra/database/prisma.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Product, ProductType } from 'generated/prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger(OrderService.name);

  async checkout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    try {
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty or not found');
      }

      return this.prisma.$transaction(
        async (tx) => {
          let totalAmount = 0;
          const orderItemsData = [];

          for (const item of cart.items) {
            const [product] = await tx.$queryRaw<Product[]>`
            SELECT * FROM "product" WHERE id = ${item.productId} FOR UPDATE
          `;

            if (!product || product.deletedAt) {
              throw new BadRequestException(
                `Product ${product?.name || ''} is not available`,
              );
            }

            if (product.type.includes(ProductType.BUNDLE)) {
              const bundleItems = await tx.bundleItem.findMany({
                where: { bundleId: product.id },
                include: { product: true },
              });

              for (const bItem of bundleItems) {
                if (bItem.product.stock < bItem.quantity * item.quantity) {
                  throw new BadRequestException(
                    `Insufficient stock for product ${bItem.product.name} in bundle ${product.name}`,
                  );
                }

                await tx.product.update({
                  where: { id: bItem.productId },
                  data: {
                    stock: { decrement: bItem.quantity * item.quantity },
                  },
                });
              }
            } else {
              if (product.stock < item.quantity) {
                throw new BadRequestException(
                  `Insufficient stock for product ${product.name}`,
                );
              }

              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }

            const priceAtPurchase = Number(product.price);
            totalAmount += priceAtPurchase * item.quantity;

            orderItemsData.push({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: priceAtPurchase,
            });
          }

          const order = await tx.order.create({
            data: {
              userId,
              totalAmount,
              status: OrderStatus.PENDING,
              items: {
                create: orderItemsData,
              },
            },
          });

          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });

          return order;
        },
        {
          timeout: 10000,
        },
      );
    } catch (error) {
      this.logger.error(
        {
          userId,
          cartId: cart?.id,
          error: error.message,
        },
        'Checkout transaction failed',
      );
      throw error;
    }
  }

  async getOrderHistory(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        priceAtPurchase: Number(item.priceAtPurchase),
      })),
    }));
  }
}

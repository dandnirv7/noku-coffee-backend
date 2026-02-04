import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { OrderStatus, ProductType, Product } from 'generated/prisma/client';
import { CreatePaymentLogDto } from '@modules/payment/dto/create-payment-log.dto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  private readonly logger = new Logger(OrderService.name);

  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = now
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
      .replace(/\//g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `NOKU-ORD-${datePart}${randomPart}`;
  }

  async checkout(userId: string, addressId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty or not found');
    }

    const physicalProductIds = new Set<string>();

    for (const item of cart.items) {
      if (item.product.type.includes(ProductType.BUNDLE)) {
        const components = await this.prisma.bundleItem.findMany({
          where: { bundleId: item.productId },
        });
        components.forEach((c) => physicalProductIds.add(c.productId));
      } else {
        physicalProductIds.add(item.productId);
      }
    }

    const sortedIds = Array.from(physicalProductIds).sort();

    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const fullAddressSnapshot = `${address.streetLine1}, ${address.streetLine2}, ${address.city}, ${address.province}, ${address.postalCode}`;

    const result = await this.prisma.$transaction(
      async (tx) => {
        let totalAmount = new Decimal(0);
        const orderItemsData = [];
        const xenditItems = [];

        await tx.$executeRawUnsafe(
          `SELECT * FROM product WHERE id IN (${sortedIds.map((id) => `'${id}'`).join(',')}) FOR UPDATE`,
        );

        for (const item of cart.items) {
          const product = item.product;
          if (product.type.includes(ProductType.BUNDLE)) {
            const bundleItems = await tx.bundleItem.findMany({
              where: { bundleId: product.id },
              include: { product: true },
            });

            for (const bItem of bundleItems) {
              const requiredQty = bItem.quantity * item.quantity;
              if (bItem.product.stock < requiredQty) {
                throw new BadRequestException(
                  `Stok komponen ${bItem.product.name} habis`,
                );
              }
              await tx.product.update({
                where: { id: bItem.productId },
                data: { stock: { decrement: requiredQty } },
              });
            }
          } else {
            const latestProduct = await tx.product.findUnique({
              where: { id: product.id },
            });
            if (latestProduct.stock < item.quantity) {
              throw new BadRequestException(`Stok ${product.name} habis`);
            }
            await tx.product.update({
              where: { id: product.id },
              data: { stock: { decrement: item.quantity } },
            });
          }

          const price = new Decimal(product.price);
          const subtotal = price.mul(item.quantity);
          totalAmount = totalAmount.add(subtotal);

          orderItemsData.push({
            productId: item.productId,
            productNameSnapshot: product.name,
            productSkuSnapshot: product.sku,
            quantity: item.quantity,
            priceAtPurchase: price,
          });

          const productWithCategory = await tx.product.findUnique({
            where: { id: item.productId },
            include: { category: true },
          });

          xenditItems.push({
            name: product.name,
            price: price.toNumber(),
            quantity: item.quantity,
            category: productWithCategory?.category?.name,
          });
        }

        const order = await tx.order.create({
          data: {
            userId,
            orderNumber: this.generateOrderNumber(),
            totalAmount,
            status: OrderStatus.PENDING,
            shippingAddress: fullAddressSnapshot,
            shippingPhone: address.phone,
            shippingReceiver: address.receiverName,
            items: { create: orderItemsData },
          },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return { order, xenditItems, totalAmount: totalAmount.toNumber() };
      },
      { timeout: 15000 },
    );

    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      const xenditInvoice = await this.paymentService.createInvoice({
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        amount: result.totalAmount,
        customer: {
          email: user.email,
          givenNames: address.receiverName,
          phoneNumber: address.phone,
          addresses: [
            {
              country: 'Indonesia',
              province: address.province,
              city: address.city,
              postalCode: address.postalCode,
              streetLine1: address.streetLine1,
            },
          ],
        },
        items: result.xenditItems,
      });

      const updatedOrder = await this.prisma.order.update({
        where: { id: result.order.id },
        data: {
          paymentExternalId: xenditInvoice.externalId,
          paymentUrl: xenditInvoice.invoiceUrl,
          paymentStatus: xenditInvoice.status,
        },
      });

      return { ...updatedOrder, xenditInvoice };
    } catch (error) {
      this.logger.error(
        `Invoice creation failed for order ${result.order.id}: ${error.message}`,
      );
      return { ...result.order, xenditInvoice: null };
    }
  }

  async markAsPaid(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new BadRequestException('Order not found');

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot pay a cancelled order. Please create a new order.',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('ALREADY_PAID');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Invalid state transition from ${order.status} to PAID`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        paymentStatus: 'PAID',
      },
    });
  }

  async markAsCancelled(orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      this.logger.warn(`Try to cancel unknown order: ${orderId}`);
      return;
    }

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.COMPLETED
    ) {
      this.logger.warn(
        `Order ${orderId} is already ${order.status}. Cancel ignored.`,
      );
      return;
    }

    if (order.status === OrderStatus.CANCELLED) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: 'EXPIRED',
          paymentLogs: {
            create: {
              status: 'CANCELLED',
              rawPayload: { reason, action: 'AUTO_CANCEL_BY_SYSTEM' },
            },
          },
        },
      });

      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { bundleItems: true },
        });

        if (!product) continue;

        if (product.type.includes(ProductType.BUNDLE)) {
          for (const component of product.bundleItems) {
            await tx.product.update({
              where: { id: component.productId },
              data: {
                stock: { increment: component.quantity * item.quantity },
              },
            });
          }
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }
      }
    });

    this.logger.log(`Order ${orderId} successfully CANCELLED and RESTOCKED.`);
  }

  async getOrderHistory(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return order?.status || null;
  }

  async createPaymentLog(
    orderId: string,
    status: string,
    payload: CreatePaymentLogDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    return this.prisma.paymentLog.create({
      data: {
        orderId,
        status,
        rawPayload: JSON.stringify(payload),
      },
    });
  }
}

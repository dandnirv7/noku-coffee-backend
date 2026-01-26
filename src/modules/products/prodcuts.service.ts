import { paginate } from '@infra/common/utils/pagination.util';
import { PrismaService } from '@infra/database/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Prisma, Product } from 'generated/prisma/client';
import { ProductType } from 'generated/prisma/enums';
import { slugify } from 'lib/utils';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const { bundleItems, ...productData } = dto;

    if (
      dto.type === ProductType.BUNDLE &&
      (!bundleItems || bundleItems.length === 0)
    ) {
      throw new BadRequestException(
        'Produk tipe Bundle harus memiliki minimal 1 item.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const productId = createId();
      const { categoryId, type, ...restProductData } = productData;

      const product = await tx.product.create({
        data: {
          id: productId,
          ...restProductData,
          slug: slugify(restProductData.name, productId),
          category: {
            connect: {
              id: categoryId,
            },
          },
          type: [type],
        },
      });

      if (product.type.includes(ProductType.BUNDLE) && bundleItems) {
        await tx.bundleItem.createMany({
          data: bundleItems.map((item) => ({
            bundleId: product.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }

      return product;
    });
  }

  async findAll(query: {
    type?: ProductType;
    page?: number;
    perPage?: number;
  }) {
    const { type, page, perPage } = query;

    return paginate<Product, Prisma.ProductFindManyArgs>(
      this.prisma.product,
      {
        where: type ? { type: { has: type } } : {},
        include: {
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      { page, perPage },
    );
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        bundleItems: {
          include: { product: { select: { name: true, price: true } } },
        },
      },
    });
  }
}

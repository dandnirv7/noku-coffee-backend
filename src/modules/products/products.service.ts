import { paginate } from '@infra/common/utils/pagination.util';
import { PrismaService } from '@infra/database/prisma.service';
import { SupabaseService } from '@infra/storage/supabase.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Prisma, Product } from 'generated/prisma/client';
import { ProductType } from 'generated/prisma/enums';
import { slugify } from 'lib/utils';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterBuilder } from './utils/product-filter.util';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  private async findOneByIdOrThrow(id: string) {
    const product = await this.prisma.extended.product.findUnique({
      where: { id },
    });
    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto, files?: Express.Multer.File[]) {
    const { bundleItems, ...productData } = dto;

    if (
      dto.type === ProductType.BUNDLE &&
      (!bundleItems || bundleItems.length === 0)
    ) {
      throw new BadRequestException(
        'Bundle product must have at least one item.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const productId = createId();
      let imageUrls: string[] = [];
      const { categoryId, type, ...restProductData } = productData;

      if (files && files.length > 0) {
        imageUrls = await Promise.all(
          files.map((file) => this.supabaseService.uploadImage(file)),
        );
      }

      const product = await tx.product.create({
        data: {
          id: productId,
          ...restProductData,
          slug: slugify(restProductData.name, productId),
          images: imageUrls,
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
    category?: string | string[];
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    perPage?: number;
  }) {
    const { where, orderBy } = ProductFilterBuilder.build(query);

    return paginate<Product, Prisma.ProductFindManyArgs>(
      this.prisma.extended.product,
      {
        where,
        orderBy,
        include: { category: { select: { name: true, slug: true } } },
      },
      { page: query.page, perPage: query.perPage },
    );
  }

  async findOne(slug: string) {
    const product = await this.prisma.extended.product.findUnique({
      where: { slug, deletedAt: null },
      include: {
        category: { select: { name: true } },
        bundleItems: {
          include: { product: { select: { name: true, price: true } } },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
    const oldProduct = await this.findOneByIdOrThrow(id);

    return this.prisma.$transaction(async (tx) => {
      const { categoryId, bundleItems, type, ...restUpdateData } = dto;

      let imageUrls = oldProduct.images;

      if (file) {
        await this.supabaseService.deleteImages(oldProduct.images);
        const newUrl = await this.supabaseService.uploadImage(file);
        imageUrls = [newUrl];
      }

      const newSlug = dto.name ? slugify(dto.name, id) : oldProduct.slug;

      return tx.product.update({
        where: { id },
        data: {
          ...restUpdateData,
          slug: newSlug,
          images: imageUrls,
          ...(type && { type: [type] }),
          ...(categoryId && {
            category: { connect: { id: categoryId } },
          }),
        },
      });
    });
  }

  async remove(id: string) {
    const product = await this.findOneByIdOrThrow(id);

    await this.supabaseService.deleteImages(product.images);

    return this.prisma.extended.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async updateImageOrder(id: string, imageUrls: string[]) {
    await this.findOneByIdOrThrow(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        images: {
          set: imageUrls,
        },
      },
    });
  }
}

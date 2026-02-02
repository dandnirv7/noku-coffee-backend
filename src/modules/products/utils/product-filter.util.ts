import { Prisma } from 'generated/prisma/client';
import { ProductType } from 'generated/prisma/enums';

export class ProductFilterBuilder {
  static build(query: {
    type?: ProductType;
    category?: string | string[];
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) {
    const where: Prisma.ProductWhereInput = {};
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (query.type) where.type = { has: query.type };

    if (query.search)
      where.name = { contains: query.search, mode: 'insensitive' };

    if (query.category) {
      const categories = Array.isArray(query.category)
        ? query.category
        : [query.category];

      if (categories.length > 0) {
        where.category = {
          slug: {
            in: categories,
          },
        };
      }
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { gte: query.minPrice, lte: query.maxPrice };
    }

    const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
      name_asc: { name: 'asc' },
      name_desc: { name: 'desc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
    };

    if (query.sort && sortMap[query.sort]) {
      orderBy = sortMap[query.sort];
    }

    return { where, orderBy };
  }
}

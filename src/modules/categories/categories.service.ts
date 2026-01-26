import { paginate } from '@infra/common/utils/pagination.util';
import { PrismaService } from '@infra/database/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Category, Prisma } from 'generated/prisma/client';
import { slugify } from 'lib/utils';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    const slug = slugify(name);
    try {
      return await this.prisma.category.create({
        data: { name, slug },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Category sudah ada!');
      }
      throw error;
    }
  }

  async findAll(query: { page?: number; perPage?: number }) {
    const { page, perPage } = query;
    return paginate<Category, Prisma.CategoryFindManyArgs>(
      this.prisma.category,
      {
        orderBy: { name: 'asc' },
      },
      { page, perPage },
    );
  }
}

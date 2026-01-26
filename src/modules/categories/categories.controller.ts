import { Roles } from '@infra/auth/decorators/roles.decorator';
import { RolesGuard } from '@infra/auth/guards/roles.guard';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { UserRole } from 'generated/prisma/enums';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
@UseGuards(RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto.name);
  }

  @Get()
  @AllowAnonymous()
  async findAll(
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.categoriesService.findAll({ page, perPage });
  }
}

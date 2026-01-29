import { Roles } from '@infra/auth/decorators/roles.decorator';
import { RolesGuard } from '@infra/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
    return {
      message: 'Category created successfully',
      data: await this.categoriesService.create(dto.name),
    };
  }

  @Get()
  @AllowAnonymous()
  async findAll(
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return {
      message: 'Categories retrieved successfully',
      data: await this.categoriesService.findAll({ page, perPage }),
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    return {
      message: 'Category deleted successfully',
      data: await this.categoriesService.delete(id),
    };
  }
}

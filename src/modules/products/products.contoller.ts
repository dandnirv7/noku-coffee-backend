import { Roles } from '@infra/auth/decorators/roles.decorator';
import { RolesGuard } from '@infra/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ProductType, UserRole } from 'generated/prisma/enums';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './prodcuts.service';

@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() CreateProductDto: CreateProductDto) {
    return {
      message: 'Product created successfully',
      data: await this.productsService.create(CreateProductDto),
    };
  }

  @Get()
  @AllowAnonymous()
  async findAll(
    @Query('type') type?: ProductType,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    const products = await this.productsService.findAll({
      type,
      page,
      perPage,
    });
    return {
      message: 'Products retrieved successfully',
      data: products,
    };
  }

  @Get(':id')
  @AllowAnonymous()
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  }
}

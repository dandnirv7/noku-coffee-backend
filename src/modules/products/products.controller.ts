import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AllowAnonymous, Roles } from '@thallesp/nestjs-better-auth';
import { ProductType, UserRole } from 'generated/prisma/enums';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateImageOrderDto } from './dto/update-image-order.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@Roles([UserRole.ADMIN])
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles([UserRole.ADMIN])
  @UseInterceptors(FilesInterceptor('image', 5))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    files?: Express.Multer.File[],
  ) {
    return {
      message: 'Product created successfully',
      data: await this.productsService.create(createProductDto, files),
    };
  }

  @Get()
  @AllowAnonymous()
  async findAll(
    @Query('type') type?: ProductType,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
    @Query('category') category?: string | string[],
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sort') sort?: string,
  ) {
    const categoryArray = Array.isArray(category)
      ? category
      : category
        ? [category]
        : [];

    const products = await this.productsService.findAll({
      type,
      page,
      perPage,
      search,
      category: categoryArray,
      minPrice,
      maxPrice,
      sort,
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

  @Patch(':id')
  @Roles([UserRole.ADMIN])
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return {
      message: 'Product updated successfully',
      data: await this.productsService.update(id, updateProductDto, file),
    };
  }

  @Delete(':id')
  @Roles([UserRole.ADMIN])
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return {
      message: 'Product deleted successfully',
    };
  }

  @Patch(':id/restore')
  @Roles([UserRole.ADMIN])
  async restore(@Param('id') id: string) {
    await this.productsService.restore(id);
    return {
      message: 'Product restored successfully',
      data: await this.productsService.findOne(id),
    };
  }

  @Patch(':id/images/reorder')
  @Roles([UserRole.ADMIN])
  async reorderImages(
    @Param('id') id: string,
    @Body() updateImageOrderDto: UpdateImageOrderDto,
  ) {
    const updatedProduct = await this.productsService.updateImageOrder(
      id,
      updateImageOrderDto.images,
    );

    return {
      message: 'Image order updated successfully',
      data: updatedProduct,
    };
  }
}

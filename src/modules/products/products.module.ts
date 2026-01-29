import { Module } from '@nestjs/common';
import { SupabaseService } from '@infra/storage/supabase.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, SupabaseService],
  exports: [ProductsService, SupabaseService],
})
export class ProductsModule {}

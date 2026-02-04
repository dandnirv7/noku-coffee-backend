import { createAuth } from '@infra/auth/auth';
import { PrismaModule } from '@infra/database/prisma.module';
import { PrismaService } from '@infra/database/prisma.service';
import { MailerModule } from '@infra/mailer/mailer.module';
import { MailerService } from '@infra/mailer/mailer.service';
import { CartModule } from '@modules/cart/cart.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { OrderModule } from '@modules/order/order.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ProductsModule } from '@modules/products/products.module';
import { WishlistModule } from '@modules/wishlist/wishlist.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    MailerModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    WishlistModule,
    OrderModule,
    PaymentModule,
    AuthModule.forRootAsync({
      imports: [PrismaModule, MailerModule],
      inject: [PrismaService, MailerService],
      useFactory: (prisma: PrismaService, mailer: MailerService) => ({
        auth: createAuth(prisma, mailer),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

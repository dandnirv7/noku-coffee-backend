import { createAuth } from '@infra/auth/auth';
import { PrismaModule } from '@infra/database/prisma.module';
import { PrismaService } from '@infra/database/prisma.service';
import { MailerModule } from '@infra/mailer/mailer.module';
import { MailerService } from '@infra/mailer/mailer.service';
import { CartModule } from '@modules/cart/cart.module';
import { CategoriesModule } from '@modules/categories/categories.module';
import { DailyDiscountModule } from '@modules/daily-discount/daily-discount.module';
import { OrderModule } from '@modules/order/order.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { ProductsModule } from '@modules/products/products.module';
import { PromoModule } from '@modules/promo/promo.module';
import { TransactionModule } from '@modules/transaction/transaction.module';
import { UserController } from '@modules/user/user.controller';
import { WishlistModule } from '@modules/wishlist/wishlist.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    MailerModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    WishlistModule,
    OrderModule,
    PaymentModule,
    TransactionModule,
    PromoModule,
    DailyDiscountModule,
    ScheduleModule.forRoot(),
    AuthModule.forRootAsync({
      imports: [PrismaModule, MailerModule],
      inject: [PrismaService, MailerService],
      useFactory: (prisma: PrismaService, mailer: MailerService) => ({
        auth: createAuth(prisma, mailer),
      }),
    }),
  ],
  controllers: [AppController, UserController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

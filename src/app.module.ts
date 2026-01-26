import { createAuth } from '@infra/auth/auth';
import { PrismaModule } from '@infra/database/prisma.module';
import { PrismaService } from '@infra/database/prisma.service';
import { MailerModule } from '@infra/mailer/mailer.module';
import { MailerService } from '@infra/mailer/mailer.service';
import { CategoriesController } from '@modules/categories/categories.controller';
import { CategoriesService } from '@modules/categories/categories.service';
import { ProductsService } from '@modules/products/prodcuts.service';
import { ProductsController } from '@modules/products/products.contoller';
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
    AuthModule.forRootAsync({
      imports: [PrismaModule, MailerModule],
      inject: [PrismaService, MailerService],
      useFactory: (prisma: PrismaService, mailer: MailerService) => ({
        auth: createAuth(prisma, mailer),
      }),
    }),
  ],
  controllers: [AppController, CategoriesController, ProductsController],
  providers: [AppService, CategoriesService, ProductsService],
})
export class AppModule {}

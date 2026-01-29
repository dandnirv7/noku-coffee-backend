import { createAuth } from '@infra/auth/auth';
import { PrismaModule } from '@infra/database/prisma.module';
import { PrismaService } from '@infra/database/prisma.service';
import { MailerModule } from '@infra/mailer/mailer.module';
import { MailerService } from '@infra/mailer/mailer.service';
import { CategoriesController } from '@modules/categories/categories.controller';
import { CategoriesService } from '@modules/categories/categories.service';
import { ProductsModule } from '@modules/products/products.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from '@modules/categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    MailerModule,
    ProductsModule,
    CategoriesModule,
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

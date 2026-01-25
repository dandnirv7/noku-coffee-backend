import { createAuth } from '@infra/auth/auth';
import { PrismaModule } from '@infra/database/prisma.module';
import { PrismaService } from '@infra/database/prisma.service';
import { MailerModule } from '@infra/mailer/mailer.module';
import { MailerService } from '@infra/mailer/mailer.service';
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

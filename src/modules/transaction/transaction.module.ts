import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionController } from './transaction.controller';
import { XenditService } from './xendit.service';
import { PrismaModule } from '@infra/database/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [TransactionController],
  providers: [XenditService],
  exports: [XenditService],
})
export class TransactionModule {}

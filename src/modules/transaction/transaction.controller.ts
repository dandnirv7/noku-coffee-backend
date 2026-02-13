import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedGuard } from '@infra/common/guards/auth.guard';
import { XenditService } from './xendit.service';
import {
  ListTransactionsDto,
  TransactionDto,
  TransactionListResponseDto,
} from './dto';

@Controller('transactions')
@UseGuards(AuthenticatedGuard)
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly xenditService: XenditService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listTransactions(
    @Query() query: ListTransactionsDto,
  ): Promise<TransactionListResponseDto> {
    this.logger.log(
      `Listing transactions with filters: ${JSON.stringify(query)}`,
    );
    return this.xenditService.listTransactions(query);
  }

  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getTransaction(@Param('id') id: string): Promise<TransactionDto> {
    this.logger.log(`Fetching transaction: ${id}`);
    return this.xenditService.getTransactionById(id);
  }
}

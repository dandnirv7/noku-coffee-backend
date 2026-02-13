import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum TransactionType {
  ADJUSTMENT_ADD = 'ADJUSTMENT_ADD',
  ADJUSTMENT_DEDUCT = 'ADJUSTMENT_DEDUCT',
  BNPL_PARTNER_SETTLEMENT_CREDIT = 'BNPL_PARTNER_SETTLEMENT_CREDIT',
  BNPL_PARTNER_SETTLEMENT_DEBIT = 'BNPL_PARTNER_SETTLEMENT_DEBIT',
  CASHBACK_FEE = 'CASHBACK_FEE',
  CASHBACK_VAT = 'CASHBACK_VAT',
  CHARGEBACK = 'CHARGEBACK',
  CONVERSION = 'CONVERSION',
  DISBURSEMENT = 'DISBURSEMENT',
  FOREX_DEDUCTION = 'FOREX_DEDUCTION',
  FOREX_DEPOSIT = 'FOREX_DEPOSIT',
  IN_PERSON_PAYMENT = 'IN_PERSON_PAYMENT',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  OTHER = 'OTHER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  REMITTANCE = 'REMITTANCE',
  REMITTANCE_COLLECTION_PAYMENT = 'REMITTANCE_COLLECTION_PAYMENT',
  REMITTANCE_PAYOUT = 'REMITTANCE_PAYOUT',
  RESERVES_HOLD = 'RESERVES_HOLD',
  RESERVES_RELEASE = 'RESERVES_RELEASE',
  TOPUP = 'TOPUP',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  VOIDED = 'VOIDED',
  REVERSED = 'REVERSED',
}

export enum ChannelCategory {
  BANK = 'BANK',
  CARDS = 'CARDS',
  CARDLESS_CREDIT = 'CARDLESS_CREDIT',
  CASH = 'CASH',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  EWALLET = 'EWALLET',
  OTHER = 'OTHER',
  PAYLATER = 'PAYLATER',
  QR_CODE = 'QR_CODE',
  RETAIL_OUTLET = 'RETAIL_OUTLET',
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT',
  XENPLATFORM = 'XENPLATFORM',
}

export enum Currency {
  IDR = 'IDR',
  PHP = 'PHP',
  USD = 'USD',
  VND = 'VND',
  THB = 'THB',
  MYR = 'MYR',
  SGD = 'SGD',
  EUR = 'EUR',
  GBP = 'GBP',
  HKD = 'HKD',
  AUD = 'AUD',
}

export class ListTransactionsDto {
  @IsOptional()
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  types?: TransactionType[];

  @IsOptional()
  @IsArray()
  @IsEnum(TransactionStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: TransactionStatus[];

  @IsOptional()
  @IsArray()
  @IsEnum(ChannelCategory, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  channelCategories?: ChannelCategory[];

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  accountIdentifier?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  createdAfter?: string;

  @IsOptional()
  @IsString()
  createdBefore?: string;

  @IsOptional()
  @IsString()
  updatedAfter?: string;

  @IsOptional()
  @IsString()
  updatedBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  afterId?: string;

  @IsOptional()
  @IsString()
  beforeId?: string;
}

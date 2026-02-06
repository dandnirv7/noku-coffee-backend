import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

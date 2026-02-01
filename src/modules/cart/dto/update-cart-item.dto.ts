import { IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(99, { message: 'Quantity must be at most 99' })
  @Type(() => Number)
  quantity: number;
}

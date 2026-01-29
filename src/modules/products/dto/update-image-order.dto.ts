import { IsArray, IsString } from 'class-validator';

export class UpdateImageOrderDto {
  @IsArray()
  @IsString({ each: true })
  images: string[];
}

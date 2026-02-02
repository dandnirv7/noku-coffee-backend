import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isCuid } from '@paralleldrive/cuid2';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isCuid(value)) {
      throw new BadRequestException(
        `Validation failed (CUID is expected for ${metadata.data})`,
      );
    }
    return value;
  }
}

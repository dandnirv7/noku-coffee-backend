import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class XenditWebhookGuard implements CanActivate {
  private readonly logger = new Logger(XenditWebhookGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const callbackToken = request.headers['x-callback-token'];

    const expectedToken = this.configService.get<string>(
      'XENDIT_CALLBACK_TOKEN',
    );

    if (!callbackToken) {
      this.logger.warn('Webhook blocked: Missing x-callback-token header');
      throw new UnauthorizedException('Security token missing');
    }

    if (!expectedToken) {
      this.logger.error(
        'Webhook blocked: Server misconfiguration (Missing XENDIT_CALLBACK_TOKEN in .env)',
      );
      throw new UnauthorizedException('Server configuration error');
    }

    const tokenBuffer = Buffer.from(callbackToken.toString());
    const expectedBuffer = Buffer.from(expectedToken);

    if (tokenBuffer.length !== expectedBuffer.length) {
      this.logger.warn('Webhook blocked: Invalid token length');
      throw new UnauthorizedException('Invalid payment signal');
    }

    if (!timingSafeEqual(tokenBuffer, expectedBuffer)) {
      this.logger.warn('Webhook blocked: Invalid token signature');
      throw new UnauthorizedException('Invalid payment signal');
    }

    return true;
  }
}

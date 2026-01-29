import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DIRECT_URL,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    if (!process.env.DIRECT_URL) {
      throw new Error('DIRECT_URL is not defined in environment variables');
    }
    await this.$connect();
  }

  async onApplicationShutdown(signal?: string) {
    await this.$disconnect();
  }

  readonly extended = this.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const softDeleteModels = ['User', 'Category', 'Product'];

          if (
            softDeleteModels.includes(model) &&
            ['findMany', 'findUnique', 'findFirst', 'count'].includes(operation)
          ) {
            const queryArgs = args as { where?: Record<string, unknown> };

            queryArgs.where = {
              ...(queryArgs.where || {}),
              deletedAt: null,
            };

            return query(queryArgs as typeof args);
          }

          return query(args);
        },
      },
    },
  });
}

import { PrismaExceptionFilter } from '@infra/common/filters/prisma-exception.filter';
import { TransformInterceptor } from '@infra/common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  const server = app.getHttpAdapter().getInstance();
  server.set('trust proxy', 1);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapter));

  app.enableCors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'cache-control',
      'ngrok-skip-browser-warning',
      'x-requested-with',
    ],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 Server running at port ${port}`);
}

bootstrap();

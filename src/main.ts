import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://riec-frontend.onrender.com',
      'https://riec.rw',
      'https://www.riec.rw',
      ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── Root route → Welcome page ────────────────────────────────────────────
  // The Express instance underlying NestJS handles this directly.
  // It serves index.html at GET /
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Global response interceptor & exception filter
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('RIEC API')
    .setDescription('RIEC backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();

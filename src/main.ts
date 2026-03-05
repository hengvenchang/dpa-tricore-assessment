import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix 'api'
  app.setGlobalPrefix('api');

  // Enable URI-based versioning
  app.enableVersioning({
    type: VersioningType.URI, // This allows /v1/... style
  });
  
  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('DPA API')
    .setDescription('The DPA API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: true, // throw error if extra properties are sent
      transform: true, // automatically transform payload to DTO class instance
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

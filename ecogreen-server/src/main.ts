import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: 'mqtt://broker.emqx.io:1883',
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Ecogreen API')
    .setDescription('API documentation for Ecogreen application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001, process.env.HOST ?? '0.0.0.0');

  console.log(
    `Server dang chay HTTP (port ${process.env.PORT ?? 3001}) va da ket noi MQTT!`,
  );
}
bootstrap();

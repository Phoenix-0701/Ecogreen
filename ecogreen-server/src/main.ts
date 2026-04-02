import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // KÍCH HOẠT KIỂM DUYỆT BẢO MẬT TOÀN CỤC
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động vứt bỏ các trường "rác" khách cố tình gửi lên thêm để hack
      forbidNonWhitelisted: true, // Báo lỗi nếu khách gửi trường lạ
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Ăng-ten bắt sóng MQTT
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.MQTT,
  //   options: {
  //     url: 'mqtt://broker.emqx.io:1883', // Trạm bưu điện công cộng miễn phí
  //   },
  // });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: 'mqtt://localhost:1883',
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Ecogreen API')
    .setDescription('API documentation for PetCare application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);

  console.log('🚀 Server đang chạy HTTP (port 3000) và đã kết nối MQTT!');
}
bootstrap();

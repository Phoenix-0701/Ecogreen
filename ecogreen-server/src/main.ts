import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // KÍCH HOẠT KIỂM DUYỆT BẢO MẬT TOÀN CỤC
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động vứt bỏ các trường "rác" khách cố tình gửi lên thêm để hack
      forbidNonWhitelisted: true, // Báo lỗi thẳng vào mặt nếu khách gửi trường lạ
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

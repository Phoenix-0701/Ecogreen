import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  // Cấp cho anh bảo vệ một cái máy quét JWT
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Yêu cầu khách đưa thẻ từ trên Header của Request xuống
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // Không có thẻ -> Đuổi cổ ngay lập tức
      throw new UnauthorizedException('Bạn chưa xuất trình Thẻ VIP (Token)!');
    }

    try {
      // 2. Bỏ thẻ vào máy quét để xác minh chữ ký và hạn sử dụng
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'ecogreen_super_secret_key_2026',
      });

      // 3. Quét thành công! Gắn thông tin khách hàng (Payload) vào trong Request
      // để tý nữa anh Bồi bàn (Controller) biết khách VIP này tên gì.
      request['user'] = payload;
    } catch {
      // Thẻ giả hoặc thẻ hết hạn -> Báo công an
      throw new UnauthorizedException('Thẻ VIP giả hoặc đã hết hạn!');
    }

    return true; // Cho phép mở cửa đi qua
  }

  // Hàm phụ: Lục lọi thẻ trong túi (Header) của khách
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

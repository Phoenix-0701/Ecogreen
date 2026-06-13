import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

// Mock thư viện bcrypt để giả lập việc kiểm tra mật khẩu
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: DeepMockProxy<PrismaService>;
  
  // Tạo một mock đơn giản cho JwtService
  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Xóa lịch sử gọi mock sau mỗi test case để tránh xung đột
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      username: 'hoang_iot',
      password: 'password123',
    };

    const mockDbUser = {
      User_ID: 1,
      username: 'hoang_iot',
      password_hash: 'hashed_password_from_db',
      email: 'hoang@example.com',
      full_name: 'Nguyen Huy Hoang',
    };

    it('should return a valid token and user info upon successful login', async () => {
      // 1. Arrange
      // Giả lập tìm thấy user trong Database
      prismaMock.uSERS.findUnique.mockResolvedValue(mockDbUser as any);
      
      // Giả lập kiểm tra mật khẩu khớp (true)
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      // Giả lập JWT sinh ra token
      mockJwtService.signAsync.mockResolvedValue('mocked_access_token_123');

      // 2. Act
      const result = await service.login(loginDto);

      // 3. Assert
      expect(prismaMock.uSERS.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockDbUser.password_hash);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockDbUser.User_ID,
        username: mockDbUser.username,
      });
      
      expect(result).toEqual({
        message: '🎉 Đăng nhập thành công!',
        access_token: 'mocked_access_token_123',
        user: {
          User_ID: mockDbUser.User_ID,
          username: mockDbUser.username,
          email: mockDbUser.email,
          full_name: mockDbUser.full_name,
        },
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      // Giả lập không tìm thấy user (DB trả về null)
      prismaMock.uSERS.findUnique.mockResolvedValue(null);

      // Kỳ vọng hàm login sẽ ném ra lỗi
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Username hoặc mật khẩu không chính xác!');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      // Giả lập tìm thấy user
      prismaMock.uSERS.findUnique.mockResolvedValue(mockDbUser as any);
      
      // Giả lập kiểm tra mật khẩu SAI (false)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Kỳ vọng hàm login sẽ ném ra lỗi
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

// Yêu cầu Jest làm giả toàn bộ thư viện bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'hoang_iot',
          email: 'hoang@example.com',
          password_hash: 'hashed123',
          full_name: 'Nguyen Huy Hoang',
        },
      ];

      prismaMock.uSERS.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.findAll();

      expect(prismaMock.uSERS.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        username: 'hoang_iot',
        email: 'hoang@example.com',
        password: 'password123',
        full_name: 'Nguyen Huy Hoang',
      };

      const mockCreatedUser = {
        id: 1,
        username: 'hoang_iot',
        email: 'hoang@example.com',
        password_hash: 'some_hashed_password',
        full_name: 'Nguyen Huy Hoang',
      };

      // CÁCH MOCK MỚI: Thiết lập kết quả trả về cho hàm hash đã được mock ở đầu file
      (bcrypt.hash as jest.Mock).mockResolvedValue('some_hashed_password');

      prismaMock.uSERS.create.mockResolvedValue(mockCreatedUser as any);

      const result = await service.create(createUserDto);

      expect(result).toEqual({
        message: '🎉 Tạo tài khoản thành công và đã lưu vào DB!',
        user: mockCreatedUser,
      });
      
      expect(prismaMock.uSERS.create).toHaveBeenCalledWith({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password_hash: 'some_hashed_password',
          full_name: createUserDto.full_name,
        },
      });
    });
  });
});
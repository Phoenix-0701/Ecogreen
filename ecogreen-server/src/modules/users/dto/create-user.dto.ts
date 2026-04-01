import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Username phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @IsEmail({}, { message: 'Email không đúng định dạng (VD: abc@gmail.com)' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có độ dài ít nhất 6 ký tự' })
  password: string;

  @IsString({ message: 'Họ tên phải là chuỗi văn bản' })
  @IsOptional()
  full_name?: string;
}

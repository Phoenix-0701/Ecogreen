import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Thay email bằng username
  @IsString({ message: 'Username phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

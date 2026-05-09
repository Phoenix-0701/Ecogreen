import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ MAC không được để trống' })
  mac_address: string;
}

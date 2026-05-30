import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ MAC không được để trống' })
  @Matches(/^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$|^[0-9A-Fa-f]{12}$/, {
    message:
      'Địa chỉ MAC không hợp lệ. Định dạng đúng: AA:BB:CC:DD:EE:FF hoặc AABBCCDDEEFF',
  })
  mac_address: string;
}

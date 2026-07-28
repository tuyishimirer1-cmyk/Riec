import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreatePurchaseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '65f34e7e0a2b3c4d5e6f7892' })
  tierId: string;

  @IsEmail()
  @ApiProperty({ example: 'buyer@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'FLW-REF-123456' })
  flutterwaveRef: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'NGN' })
  currency: string;

  @IsNotEmpty()
  @ApiProperty({ example: 150000 })
  amount: number;
}

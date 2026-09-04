import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PropertyInquiryDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0788123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'I am interested in viewing this property. Please contact me.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}

export class PropertyViewingDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0788123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '2026-09-01T10:00:00Z' })
  @IsString()
  preferredDate: string;

  @ApiProperty({ example: '10:00 AM' })
  @IsString()
  preferredTime: string;

  @ApiProperty({ example: 'I would like to view this property.' })
  @IsString()
  @MaxLength(500)
  message: string;
}

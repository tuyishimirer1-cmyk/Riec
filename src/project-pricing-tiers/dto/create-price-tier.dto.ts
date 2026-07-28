import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePriceTierDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Basic Package' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Includes site plan and architectural drawings',
  })
  description?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'NGN' })
  currency: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 150000 })
  amount: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}

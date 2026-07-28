import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';

class ServiceTaskDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Site Analysis' })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'We assess the site conditions thoroughly.' })
  description: string;
}

export class CreateServiceDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Architectural Design' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'architectural-design' })
  slug: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'We design beautiful and functional spaces.' })
  shortDescription: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Full detailed description...' })
  detailedDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 1 })
  order?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Building Your Vision' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Rich content description...' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Our process involves...' })
  process?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceTaskDto)
  @ApiPropertyOptional({ type: [ServiceTaskDto] })
  mainTasks?: ServiceTaskDto[];

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: false, default: false })
  isPublished?: boolean;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProjectCategory, ProjectType } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'Modern Family Villa' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Lekki, Lagos, Nigeria',
    description: 'Project location (city/region/country)',
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({
    example: ['architectural-design', 'construction-management'],
    description: 'Array of service slugs for this project',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceSlugs?: string[];

  @ApiProperty({ enum: ProjectType, example: ProjectType.COMPLETED })
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiProperty({
    enum: ProjectCategory,
    example: ProjectCategory.RESIDENTIAL,
  })
  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @ApiProperty({ example: 'A contemporary villa designed for comfort.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  purchasable?: boolean;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=abc123',
    description: 'YouTube video URL for completed projects',
  })
  @IsOptional()
  @IsString()
  youtubeVideoUrl?: string;
}

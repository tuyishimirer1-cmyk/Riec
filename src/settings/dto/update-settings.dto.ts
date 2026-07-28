import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'RIEC Dashboard' })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional({ example: 'https://riec.com' })
  @IsOptional()
  @IsString()
  siteUrl?: string;

  @ApiPropertyOptional({ example: 'RIEC - Real Estate Development' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Real estate development company' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: ['about', 'services', 'projects', 'contact'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pages?: string[];
}

export class UpdateSocialLinksDto {
  @ApiPropertyOptional({ example: 'https://facebook.com/riec' })
  @IsOptional()
  @IsString()
  facebook?: string | null;

  @ApiPropertyOptional({ example: 'https://twitter.com/riec' })
  @IsOptional()
  @IsString()
  twitter?: string | null;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/riec' })
  @IsOptional()
  @IsString()
  linkedin?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/riec' })
  @IsOptional()
  @IsString()
  instagram?: string | null;

  @ApiPropertyOptional({ example: 'https://youtube.com/riec' })
  @IsOptional()
  @IsString()
  youtube?: string | null;
}

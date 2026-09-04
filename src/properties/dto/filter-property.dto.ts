import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PropertyType, ListingType } from './create-property.dto';

export class FilterPropertyDto {
  @ApiPropertyOptional({ example: 'house kigali' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: ListingType })
  @IsEnum(ListingType)
  @IsOptional()
  listingType?: ListingType;

  @ApiPropertyOptional({ example: 'Kigali' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Kicukiro' })
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional({ example: 1000000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500000000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minLandSize?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxLandSize?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bathrooms?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  verifiedOnly?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  featuredOnly?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', enum: ['createdAt', 'price', 'landSize'] })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

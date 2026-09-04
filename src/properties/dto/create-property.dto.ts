import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean, Min, Max, IsEmail, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
  LAND = 'LAND',
  COMMERCIAL = 'COMMERCIAL',
  VILLA = 'VILLA',
  OTHER = 'OTHER',
}

export enum ListingType {
  FOR_SALE = 'FOR_SALE',
  FOR_RENT = 'FOR_RENT',
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Modern 4 Bedroom House in Kicukiro' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Beautiful modern house with garden and parking' })
  @IsString()
  description: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.HOUSE })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiProperty({ enum: ListingType, example: ListingType.FOR_SALE })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({ example: 150000000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'RWF', default: 'RWF' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  priceNegotiable?: boolean;

  @ApiProperty({ example: 'Kigali' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Kicukiro' })
  @IsString()
  sector: string;

  @ApiProperty({ example: 'Gatenga' })
  @IsString()
  cell: string;

  @ApiPropertyOptional({ example: 'KG 123 St' })
  @IsString()
  @IsOptional()
  streetAddress?: string;

  @ApiPropertyOptional({ example: -1.9705 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 30.1044 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 450 })
  @IsNumber()
  @Min(1)
  landSize: number;

  @ApiPropertyOptional({ example: 300 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  buildingSize?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @Min(0)
  @Max(20)
  @IsOptional()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @Min(0)
  @Max(20)
  @IsOptional()
  bathrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  parking?: number;

  @ApiPropertyOptional({ example: ['Garden', 'Swimming Pool', 'Security'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ example: '0788123456' })
  @IsString()
  @Matches(/^(\+250|0)?7[0-9]{8}$/, {
    message: 'Invalid Rwanda phone number format',
  })
  sellerPhone: string;

  @ApiPropertyOptional({ example: '0788123456' })
  @IsString()
  @IsOptional()
  sellerWhatsApp?: string;

  @ApiProperty({ example: 'seller@example.com' })
  @IsEmail()
  sellerEmail: string;
}

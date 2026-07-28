/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectDocumentType } from '@prisma/client';

export class CreateAssetDto {
  @IsEnum(ProjectDocumentType)
  @ApiProperty({ enum: ProjectDocumentType, example: 'PRESENTATION' })
  documentType: ProjectDocumentType;

  @IsOptional()
  @IsMongoId()
  @Transform(({ value }) => (value?.trim() ? value.trim() : undefined))
  @ApiPropertyOptional({ example: '65f34e7e0a2b3c4d5e6f7892' })
  tierId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'v1' })
  version?: string;
}

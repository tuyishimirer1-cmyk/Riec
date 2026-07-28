import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ProjectDocumentType } from '@prisma/client';

export class UploadAssetDto {
  @IsString()
  @ApiProperty({ example: 'projectId123' })
  projectId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'tierId123' })
  tierId?: string;

  @IsString()
  @ApiProperty({ example: 'PRESENTATION' })
  documentType: ProjectDocumentType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'v1' })
  version?: string;
}

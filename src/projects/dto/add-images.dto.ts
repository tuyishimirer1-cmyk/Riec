import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddImageDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Front view of the building' })
  caption?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 0 })
  order?: number;
}

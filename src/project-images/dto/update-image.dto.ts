import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateImageDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Front view' })
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 0 })
  order?: number;
}

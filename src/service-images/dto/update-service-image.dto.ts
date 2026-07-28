import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceImageDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Office exterior view' })
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ example: 0 })
  order?: number;
}

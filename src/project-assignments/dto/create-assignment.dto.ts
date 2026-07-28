import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '65f34e7e0a2b3c4d5e6f7893' })
  userId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Lead Engineer' })
  role?: string;
}

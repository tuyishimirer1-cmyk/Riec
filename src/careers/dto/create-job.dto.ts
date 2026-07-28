import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Senior Structural Engineer' })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Lagos, Nigeria' })
  location: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Full-time' })
  employmentType: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Engineering' })
  department: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'We are looking for an experienced structural engineer...',
  })
  description: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: "Bachelor's degree in Civil/Structural Engineering...",
  })
  requirements: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Design and analyze structural systems...' })
  responsibilities: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true, default: false })
  isPublished?: boolean;
}

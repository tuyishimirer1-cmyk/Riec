import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JobApplicationStatus } from '@prisma/client';

export class UpdateApplicationDto {
  @IsEnum(JobApplicationStatus)
  @ApiProperty({ 
    enum: JobApplicationStatus,
    example: JobApplicationStatus.IN_REVIEW 
  })
  status: JobApplicationStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Strong technical background, good fit for the role.' })
  notes?: string;
}
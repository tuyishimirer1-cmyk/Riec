import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';
import { JobApplicationStatus } from '@prisma/client';

export class BulkUpdateApplicationsDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ 
    example: ['65f34e7e0a2b3c4d5e6f7890', '65f34e7e0a2b3c4d5e6f7891'],
    description: 'Array of application IDs'
  })
  applicationIds: string[];

  @IsEnum(JobApplicationStatus)
  @ApiProperty({ 
    enum: JobApplicationStatus,
    example: JobApplicationStatus.SHORTLISTED 
  })
  status: JobApplicationStatus;
}
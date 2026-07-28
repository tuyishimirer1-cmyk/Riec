import { ApiProperty } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({ example: '623e...abc' })
  id: string;

  @ApiProperty({ example: 'projectId123' })
  projectId: string;

  @ApiProperty({ example: 'PRESENTATION' })
  documentType: string;

  @ApiProperty({ example: 'v1' })
  version?: string;

  @ApiProperty({ example: 'projects/p1/presentation.pdf' })
  s3Key: string;

  @ApiProperty({ example: 'presentation.pdf' })
  filename: string;

  @ApiProperty({ example: 'application/pdf' })
  fileType: string;

  @ApiProperty({ example: 12345 })
  size: number;

  @ApiProperty({ example: true })
  isDownloadable: boolean;

  @ApiProperty({
    example: { id: 'u1', email: 'worker@example.com', role: 'COMPANY_WORKER' },
  })
  uploadedBy: any;

  @ApiProperty({ example: '2026-02-12T00:00:00.000Z' })
  createdAt: Date;
}

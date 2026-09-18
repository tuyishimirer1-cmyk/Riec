import { ApiProperty } from '@nestjs/swagger';

export class ZipContentDto {
  @ApiProperty({ description: 'Name of the file inside the ZIP' })
  filename: string;

  @ApiProperty({ description: 'Path of the file inside the ZIP' })
  path: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Whether this is a directory' })
  isDirectory: boolean;

  @ApiProperty({ description: 'MIME type of the file' })
  mimeType?: string;
}

export class ZipContentsResponseDto {
  @ApiProperty({ description: 'Name of the ZIP file' })
  zipFilename: string;

  @ApiProperty({ description: 'Total number of files in ZIP' })
  totalFiles: number;

  @ApiProperty({ description: 'Total size of ZIP file' })
  totalSize: number;

  @ApiProperty({ type: [ZipContentDto] })
  contents: ZipContentDto[];
}

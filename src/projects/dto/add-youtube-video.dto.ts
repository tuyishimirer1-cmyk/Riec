import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddYoutubeVideoDto {
  @ApiProperty({ example: 'https://www.youtube.com/watch?v=abc123' })
  @IsNotEmpty()
  @IsString()
  youtubeVideoUrl: string;
}

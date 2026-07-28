import { IsOptional, IsUrl, IsString } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  profileImg?: string;

  @IsOptional()
  @IsUrl()
  coverImg?: string;
}

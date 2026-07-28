import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../auth/role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: Role,
    example: Role.ADMIN,
    description: 'New role for the user',
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

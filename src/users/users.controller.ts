import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('User Management')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      "Retrieve the authenticated user's profile details including related entities (projects, assignments, favorites count)",
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7000',
        email: 'client@example.com',
        role: 'CLIENT',
        profileImg: 'https://example.com/profile.jpg',
        coverImg: 'https://example.com/cover.jpg',
        createdAt: '2024-01-15T10:30:00Z',
        lastLoginAt: '2024-01-20T14:15:00Z',
        stats: {
          projectsOwned: 2,
          assignments: 3,
          favoritesCount: 5,
          purchasesCount: 1,
        },
        projectsOwned: [
          {
            id: 'proj1',
            title: 'Modern Family Villa',
            slug: 'modern-family-villa',
            isPublished: true,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        assignments: [
          {
            id: 'assign1',
            project: {
              id: 'proj1',
              title: 'Modern Family Villa',
              slug: 'modern-family-villa',
            },
            role: 'Engineer',
            assignedAt: '2024-01-16T09:00:00Z',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async getProfile(@Req() req: any) {
    const userId = req.user.userId;
    return this.usersService.getUserProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description:
      "Update the authenticated user's profile image and cover image URLs. Pass only the fields you want to update.",
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7000',
        email: 'client@example.com',
        role: 'CLIENT',
        profileImg: 'https://example.com/new-profile.jpg',
        coverImg: 'https://example.com/new-cover.jpg',
        updatedAt: '2024-01-21T10:30:00Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async updateProfile(
    @Req() req: any,
    @Body() updateData: UpdateUserProfileDto,
  ) {
    const userId = req.user.userId;
    return this.usersService.updateUserProfile(userId, updateData);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all users',
    description:
      'Retrieve a paginated list of all users. Requires admin authentication.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiOkResponse({
    description: 'List of users with pagination',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7000',
            email: 'admin@example.com',
            role: 'ADMIN',
            profileImg: null,
            createdAt: '2024-01-15T10:30:00Z',
            lastLoginAt: '2024-01-20T14:15:00Z',
          },
        ],
        total: 50,
        meta: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
        },
      },
    },
  })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('role') role?: Role,
  ) {
    return this.usersService.getUsers(+page, +limit, role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieve a single user by their ID. Requires admin authentication.',
  })
  @ApiOkResponse({
    description: 'User details',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7000',
        email: 'admin@example.com',
        role: 'ADMIN',
        profileImg: null,
        coverImg: null,
        createdAt: '2024-01-15T10:30:00Z',
        lastLoginAt: '2024-01-20T14:15:00Z',
        projectsOwned: [],
        assignments: [],
      },
    },
  })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user role',
    description:
      "Update a user's role. Only accessible by admins. Cannot downgrade yourself.",
  })
  @ApiOkResponse({
    description: 'User role updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7000',
        email: 'user@example.com',
        role: 'ENGINEER',
        updatedAt: '2024-01-21T10:30:00Z',
      },
    },
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Req() req: any,
  ) {
    return this.usersService.updateUserRole(
      id,
      updateRoleDto.role,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user',
    description:
      'Delete a user account. Cannot delete yourself. Requires admin authentication.',
  })
  @ApiOkResponse({ description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.deleteUser(id, req.user.userId);
  }

  @Get('stats/total')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user statistics',
    description:
      'Retrieve total count of users by role. Requires admin authentication.',
  })
  @ApiOkResponse({
    description: 'User statistics',
    schema: {
      example: {
        total: 150,
        ADMIN: 1,
        ENGINEER: 50,
        COMPANY_WORKER: 50,
        CLIENT: 49,
      },
    },
  })
  async getUserStats() {
    return this.usersService.getUserStats();
  }
}

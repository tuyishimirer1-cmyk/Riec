import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites Endpoints')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('projects/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a project to favorites',
    description:
      'Mark a project as favorite for the authenticated user. Only published projects can be favorited. The identifier can be either a MongoDB ObjectId or a project slug.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'MongoDB ObjectId or project slug',
    example: '65f34e7e0a2b3c4d5e6f7890 or modern-family-villa',
  })
  @ApiCreatedResponse({
    description: 'Project added to favorites successfully',
    schema: {
      example: {
        id: 'fav1',
        userId: '65f34e7e0a2b3c4d5e6f7000',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        project: {
          id: '65f34e7e0a2b3c4d5e6f7890',
          title: 'Modern Family Villa',
          slug: 'modern-family-villa',
          location: 'Lekki, Lagos',
          type: 'PLAN_TO_BUY',
          category: 'RESIDENTIAL',
          featured: true,
        },
        createdAt: '2024-01-15T14:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Project not found or not published' })
  @ApiConflictResponse({ description: 'Project is already in favorites' })
  async addFavorite(@Param('identifier') identifier: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.favoritesService.addFavorite(userId, identifier);
  }

  @Delete('projects/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove a project from favorites',
    description:
      'Unmark a project as favorite for the authenticated user. The identifier can be either a MongoDB ObjectId or a project slug.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'MongoDB ObjectId or project slug',
    example: '65f34e7e0a2b3c4d5e6f7890 or modern-family-villa',
  })
  @ApiNoContentResponse({ description: 'Project removed from favorites' })
  @ApiNotFoundResponse({ description: 'Favorite not found' })
  async removeFavorite(
    @Param('identifier') identifier: string,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    return this.favoritesService.removeFavorite(userId, identifier);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List user favorites',
    description:
      'Retrieve a paginated list of projects favorited by the authenticated user. Only includes published projects.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page (default: 20)',
  })
  @ApiOkResponse({
    description: 'Paginated list of favorited projects',
    schema: {
      example: {
        data: [
          {
            id: 'fav1',
            project: {
              id: '65f34e7e0a2b3c4d5e6f7890',
              title: 'Modern Family Villa',
              slug: 'modern-family-villa',
              location: 'Lekki, Lagos',
              type: 'PLAN_TO_BUY',
              category: 'RESIDENTIAL',
              featured: true,
              isPublished: true,
            },
            createdAt: '2024-01-15T14:30:00Z',
          },
        ],
        total: 5,
        meta: {
          total: 5,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  async getMyFavorites(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.userId;
    return this.favoritesService.getUserFavorites(userId, page, limit);
  }

  @Get('projects/:identifier/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if project is favorited',
    description:
      'Check whether the authenticated user has favorited a specific project. The identifier can be either a MongoDB ObjectId or a project slug.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'MongoDB ObjectId or project slug',
    example: '65f34e7e0a2b3c4d5e6f7890 or modern-family-villa',
  })
  @ApiOkResponse({
    description: 'Favorite status',
    schema: {
      example: { favorited: true },
    },
  })
  async checkFavorite(
    @Param('identifier') identifier: string,
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const favorited = await this.favoritesService.checkIfFavorited(
      userId,
      identifier,
    );
    return { favorited };
  }
}

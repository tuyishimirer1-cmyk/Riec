import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddYoutubeVideoDto } from './dto/add-youtube-video.dto';
import { ProjectCategory, ProjectType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Projects Endpoints')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project created successfully')
  @ApiOperation({
    summary: 'Create a new project',
    description:
      'Creates a new project with specified details. Requires admin authentication.',
  })
  @ApiCreatedResponse({
    description: 'Project created successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        title: 'Modern Family Villa',
        slug: 'modern-family-villa',
        location: 'Lekki, Lagos, Nigeria',
        type: 'COMPLETED',
        category: 'RESIDENTIAL',
        description: 'A contemporary villa designed for comfort.',
        featured: false,
        purchasable: false,
        isPublished: false,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - check request body for required fields',
  })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ResponseMessage('Projects retrieved successfully')
  @ApiOperation({
    summary: 'List projects with optional relationships',
    description:
      'Retrieve a paginated list of published projects with optional filtering and relationship inclusion. Public endpoint.',
  })
  @ApiOkResponse({
    description: 'Paginated list of projects',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            title: 'Modern Family Villa',
            slug: 'modern-family-villa',
            location: 'Lekki, Lagos, Nigeria',
            type: 'COMPLETED',
            category: 'RESIDENTIAL',
            description: 'A contemporary villa designed for comfort.',
            featured: true,
            images: [],
            services: [],
          },
        ],
        total: 50,
        meta: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiQuery({ name: 'service', required: false, description: 'Service slug' })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'featured', required: false, description: 'true/false' })
  @ApiQuery({ name: 'type', required: false, enum: ProjectType })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: Object.values(ProjectCategory),
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'published',
    required: false,
    example: 'true',
    description:
      'Filter by publish status: "true" (published only, default), "false" (drafts only), or "all" (all projects)',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    example: 'images,services,assets',
    description:
      'Comma-separated relationships to include: images, service, services, assets, pricingTiers, owner, assignments, purchases, counts',
  })
  list(
    @Query('service') service?: string,
    @Query('location') location?: string,
    @Query('featured') featured?: string,
    @Query('type') type?: ProjectType,
    @Query('category') category?: ProjectCategory,
    @Query('published') published?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('include') include?: string,
  ) {
    return this.projectsService.list(
      {
        service,
        location,
        featured: featured === 'true' ? true : undefined,
        type,
        category,
        isPublished:
          published === 'all'
            ? undefined
            : published === 'false'
              ? false
              : true, // default: published only
      },
      page,
      limit,
      include,
    );
  }

  @Get('identifier/:identifier')
  @ResponseMessage('Project retrieved successfully')
  @ApiOperation({
    summary: 'Get a project by ID or slug (unified endpoint)',
    description:
      'Retrieve a single project using either its MongoDB ID or URL-friendly slug. Supports optional relationship inclusion via include parameter. Public endpoint returns only published projects.',
  })
  @ApiParam({
    name: 'identifier',
    description:
      'Either a MongoDB ObjectId (24 hex characters) or a project slug',
    example: 'modern-family-villa or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    example: 'images,services,assets',
    description:
      'Comma-separated relationships to include:\n' +
      '- `images`: Project images\n' +
      '- `services`: Associated services\n' +
      '- `assets`: Project assets/documents\n' +
      '- `pricingTiers`: Pricing tiers (active only)\n' +
      '- `owner`: Project owner details\n' +
      '- `assignments`: Team assignments\n' +
      '- `purchases`: Purchase records\n' +
      '- `counts`: Count of related items',
  })
  @ApiOkResponse({
    description: 'Project with requested relationships',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        title: 'Modern Family Villa',
        slug: 'modern-family-villa',
        location: 'Lekki, Lagos, Nigeria',
        type: 'COMPLETED',
        category: 'RESIDENTIAL',
        description: 'A contemporary villa designed for comfort.',
        featured: true,
        purchasable: true,
        isPublished: true,
        images: [
          {
            id: 'img1',
            s3Key: 'projects/image1.jpg',
            url: 'https://cdn.example.com/projects/image1.jpg',
            caption: 'Front view',
            order: 0,
          },
        ],
        services: [
          {
            service: {
              id: 'svc1',
              name: 'Architectural Design',
              slug: 'architectural-design',
            },
          },
        ],
        pricingTiers: [
          {
            id: 'tier1',
            name: 'Basic Package',
            description: 'Includes site plan and architectural drawings',
            currency: 'NGN',
            amount: 150000,
            isActive: true,
          },
        ],
        assets: [],
        assignments: [],
        purchases: [],
        owner: {
          id: 'user1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found with the given identifier',
  })
  findByIdentifier(
    @Param('identifier') identifier: string,
    @Query('include') include?: string,
  ) {
    return this.projectsService.findByIdentifier(identifier, include);
  }

  @Put('identifier/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project updated successfully')
  @ApiOperation({
    summary: 'Update a project',
    description:
      'Update project details including title, location, services, etc. Requires admin authentication. Use either project ID or slug in the identifier parameter.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Project MongoDB ID or slug',
    example: 'modern-family-villa or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiCreatedResponse({
    description: 'Project updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        title: 'Modern Family Villa (Updated)',
        slug: 'modern-family-villa',
        location: 'Lekki, Lagos, Nigeria',
        type: 'COMPLETED',
        category: 'RESIDENTIAL',
        description: 'Updated description...',
        featured: true,
        purchasable: true,
        isPublished: false,
        updatedAt: '2024-01-16T14:20:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found with the given identifier',
  })
  update(
    @Param('identifier') identifier: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.update(identifier, dto);
  }

  @Delete('identifier/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project deleted successfully')
  @ApiOperation({
    summary: 'Delete a project',
    description:
      'Permanently deletes a project and all its associated data (images, assets, pricing tiers, etc.). Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Project MongoDB ID or slug',
    example: 'modern-family-villa or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Project deleted successfully',
    schema: {
      example: { message: 'Project deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found with the given identifier',
  })
  remove(@Param('identifier') identifier: string) {
    return this.projectsService.remove(identifier);
  }

  @Post('identifier/:identifier/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project published successfully')
  @ApiOperation({
    summary: 'Publish a project',
    description:
      'Makes a project visible to the public (sets isPublished=true and publishedAt timestamp). Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Project MongoDB ID or slug',
    example: 'modern-family-villa or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Project published successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        title: 'Modern Family Villa',
        slug: 'modern-family-villa',
        isPublished: true,
        publishedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found with the given identifier',
  })
  publish(@Param('identifier') identifier: string) {
    return this.projectsService.publish(identifier);
  }

  @Post('identifier/:identifier/unpublish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project unpublished successfully')
  @ApiOperation({
    summary: 'Unpublish a project',
    description:
      'Hides a project from public view (sets isPublished=false). Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Project MongoDB ID or slug',
    example: 'modern-family-villa or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Project unpublished successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        title: 'Modern Family Villa',
        slug: 'modern-family-villa',
        isPublished: false,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found with the given identifier',
  })
  unpublish(@Param('identifier') identifier: string) {
    return this.projectsService.unpublish(identifier);
  }

  @Get('categories')
  @ResponseMessage('Categories retrieved successfully')
  @ApiOperation({
    summary: 'Get all available project categories',
    description:
      'Returns the list of all possible project categories defined in the system.',
  })
  @ApiOkResponse({
    description: 'List of available project categories',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'],
      },
      example: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'],
    },
  })
  getCategories() {
    return this.projectsService.getCategories();
  }

  @Get('by-category/:category')
  @ResponseMessage('Projects by category retrieved successfully')
  @ApiOperation({
    summary: 'Get projects by specific category',
    description:
      'Retrieve published projects filtered by category with pagination.',
  })
  @ApiParam({
    name: 'category',
    description: 'Project category filter',
    enum: Object.values(ProjectCategory),
    example: ProjectCategory.RESIDENTIAL,
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
  getProjectsByCategory(
    @Param('category') category: ProjectCategory,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.projectsService.getProjectsByCategory(category, page, limit);
  }

  @Get('categories/:category/count')
  @ResponseMessage('Project count retrieved successfully')
  @ApiOperation({
    summary: 'Get project count by category',
    description:
      'Returns the number of published projects in a specific category.',
  })
  @ApiParam({
    name: 'category',
    description: 'Category to count',
    enum: Object.values(ProjectCategory),
    example: ProjectCategory.RESIDENTIAL,
  })
  @ApiOkResponse({
    description: 'Project count for the specified category',
    schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: Object.values(ProjectCategory) },
        count: { type: 'number' },
      },
      example: { category: 'RESIDENTIAL', count: 25 },
    },
  })
  getProjectCountByCategory(@Param('category') category: ProjectCategory) {
    return this.projectsService.getProjectCountByCategory(category);
  }

  @Get('categories/summary')
  @ResponseMessage('Category summary retrieved successfully')
  @ApiOperation({
    summary: 'Get summary statistics for all categories',
    description:
      'Returns aggregated statistics showing count and percentage distribution of published projects across all categories.',
  })
  @ApiOkResponse({
    description:
      'Summary statistics including counts and percentages for all categories',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: Object.values(ProjectCategory),
              },
              count: { type: 'number' },
            },
          },
        },
        total: { type: 'number' },
        summary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: Object.values(ProjectCategory),
              },
              count: { type: 'number' },
              percentage: { type: 'number' },
            },
          },
        },
      },
      example: {
        categories: [
          { category: 'RESIDENTIAL', count: 25 },
          { category: 'COMMERCIAL', count: 15 },
          { category: 'INDUSTRIAL', count: 10 },
        ],
        total: 50,
        summary: [
          { category: 'RESIDENTIAL', count: 25, percentage: 50 },
          { category: 'COMMERCIAL', count: 15, percentage: 30 },
          { category: 'INDUSTRIAL', count: 10, percentage: 20 },
        ],
      },
    },
  })
  getCategoriesSummary() {
    return this.projectsService.getCategoriesSummary();
  }

  @Post('identifier/:identifier/youtube-video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('YouTube video URL added successfully')
  @ApiOperation({
    summary: 'Add YouTube video URL to a completed project',
    description:
      'Adds or updates the YouTube video URL for a completed project. Only projects with type COMPLETED can have a YouTube video URL. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Project MongoDB ID or slug',
    example: 'modern-family-villa or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'YouTube video URL added successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        title: 'Modern Family Villa',
        youtubeVideoUrl: 'https://www.youtube.com/watch?v=abc123',
        updatedAt: '2024-01-16T14:20:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Project not found with the given identifier',
  })
  @ApiBadRequestResponse({
    description: 'Project is not a completed project',
  })
  addYoutubeVideo(
    @Param('identifier') identifier: string,
    @Body() dto: AddYoutubeVideoDto,
  ) {
    return this.projectsService.addYoutubeVideo(
      identifier,
      dto.youtubeVideoUrl,
    );
  }
}

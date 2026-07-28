import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { RolesGuard } from '../auth/roles.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage('Service created successfully')
  @ApiOperation({
    summary: 'Create a service',
    description:
      'Creates a new service offering. Requires admin authentication. The slug must be unique and URL-friendly.',
  })
  @ApiCreatedResponse({
    description: 'Service created successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Architectural Design',
        slug: 'architectural-design',
        shortDescription: 'We design beautiful and functional spaces.',
        detailedDescription: 'Full detailed description...',
        order: 1,
        title: 'Building Your Vision',
        description: 'Rich content description...',
        process: 'Our process involves...',
        mainTasks: [
          {
            title: 'Site Analysis',
            description: 'We assess the site conditions thoroughly.',
          },
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @ResponseMessage('Services retrieved successfully')
  @ApiOperation({
    summary: 'List all services with optional relationships',
    description:
      'Retrieve a paginated list of all services. Public endpoint. Use include parameter to fetch related data.',
  })
  @ApiOkResponse({
    description: 'Paginated list of services',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            name: 'Architectural Design',
            slug: 'architectural-design',
            shortDescription: 'We design beautiful and functional spaces.',
            order: 1,
          },
        ],
        total: 10,
        meta: {
          total: 10,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
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
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    example: 'images,projects',
    description:
      'Comma-separated relationships to include:\n' +
      '- `images`: Service images\n' +
      '- `projects`: Related published projects (max 5)\n' +
      '- `counts`: Count of related projects',
  })
  list(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('include') include?: string,
  ) {
    return this.servicesService.list(Number(page), Number(limit), include);
  }

  @Get('identifier/:identifier')
  @ResponseMessage('Service retrieved successfully')
  @ApiOperation({
    summary: 'Get a service by ID or slug (unified endpoint)',
    description:
      'Retrieve a single service using either its MongoDB ID or URL-friendly slug. Supports optional relationship inclusion via include parameter.',
  })
  @ApiParam({
    name: 'identifier',
    description:
      'Either a MongoDB ObjectId (24 hex characters) or a service slug',
    example: 'architectural-design or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    example: 'images,projects',
    description:
      'Comma-separated relationships to include:\n' +
      '- `images`: Service images\n' +
      '- `projects`: Related published projects (max 5)\n' +
      '- `counts`: Count of related projects',
  })
  @ApiOkResponse({
    description: 'Service with requested relationships',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Architectural Design',
        slug: 'architectural-design',
        shortDescription: 'We design beautiful and functional spaces.',
        detailedDescription: 'Full detailed service description...',
        order: 1,
        title: 'Building Your Vision',
        description: 'Our comprehensive architectural design service...',
        process: 'Step 1: Consultation, Step 2: Design, Step 3: Approval',
        mainTasks: [
          {
            title: 'Site Analysis',
            description: 'We assess the site conditions thoroughly.',
          },
          {
            title: 'Concept Design',
            description: 'We create initial design concepts.',
          },
        ],
        images: [
          {
            id: 'img1',
            s3Key: 'services/design1.jpg',
            url: 'https://cdn.example.com/services/design1.jpg',
            caption: 'Example project',
            order: 0,
          },
        ],
        projects: [
          {
            id: 'proj1',
            title: 'Modern Family Villa',
            slug: 'modern-family-villa',
            location: 'Lekki, Lagos',
            images: [
              { url: 'https://cdn.example.com/projects/proj1-thumb.jpg' },
            ],
            _count: { pricingTiers: 3 },
          },
        ],
        _count: { projects: 15 },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Service not found with the given identifier',
  })
  findByIdentifier(
    @Param('identifier') identifier: string,
    @Query('include') include?: string,
  ) {
    return this.servicesService.findByIdentifier(identifier, include);
  }

  @Put('identifier/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage('Service updated successfully')
  @ApiOperation({
    summary: 'Update a service',
    description:
      'Update service details. Changing the title/slug may auto-generate a new slug to ensure uniqueness. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Service MongoDB ID or current slug',
    example: 'architectural-design or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Service updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Architectural Design Updated',
        slug: 'architectural-design',
        shortDescription: 'Updated short description...',
        updatedAt: '2024-01-16T14:20:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Service not found with the given identifier',
  })
  update(
    @Param('identifier') identifier: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(identifier, dto);
  }

  @Delete('identifier/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage('Service deleted successfully')
  @ApiOperation({
    summary: 'Delete a service',
    description:
      'Permanently deletes a service. This will also affect any projects linked to this service. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Service MongoDB ID or slug',
    example: 'architectural-design or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Service deleted successfully',
    schema: {
      example: { message: 'Service deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Service not found with the given identifier',
  })
  remove(@Param('identifier') identifier: string) {
    return this.servicesService.remove(identifier);
  }

  @Post('identifier/:identifier/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage('Service published successfully')
  @ApiOperation({
    summary: 'Publish a service',
    description:
      'Makes a service visible in public listings. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Service MongoDB ID or slug',
    example: 'architectural-design or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Service published successfully',
  })
  publish(@Param('identifier') identifier: string) {
    return this.servicesService.publish(identifier);
  }

  @Post('identifier/:identifier/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage('Service unpublished successfully')
  @ApiOperation({
    summary: 'Unpublish a service',
    description:
      'Hides a service from public listings. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Service MongoDB ID or slug',
    example: 'architectural-design or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Service unpublished successfully',
  })
  unpublish(@Param('identifier') identifier: string) {
    return this.servicesService.unpublish(identifier);
  }
}

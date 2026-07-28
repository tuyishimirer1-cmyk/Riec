import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CareersService } from './careers.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Careers Endpoints')
@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job posting created successfully')
  @ApiOperation({
    summary: 'Create a new job posting',
    description:
      'Creates a new job posting. The job is created as unpublished by default. Requires admin authentication. Slug is auto-generated from title.',
  })
  @ApiCreatedResponse({
    description: 'Job created successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        slug: 'senior-structural-engineer',
        title: 'Senior Structural Engineer',
        location: 'Lagos, Nigeria',
        employmentType: 'Full-time',
        department: 'Engineering',
        description: 'We are looking for an experienced structural engineer...',
        requirements: "Bachelor's degree in Civil/Structural Engineering...",
        responsibilities: 'Design and analyze structural systems...',
        isPublished: false,
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - check request body for required fields',
  })
  create(@Body() dto: CreateJobDto) {
    return this.careersService.create(dto);
  }

  @Get()
  @ResponseMessage('Jobs retrieved successfully')
  @ApiOperation({
    summary: 'List published jobs (public) or all jobs (admin)',
    description:
      'Retrieve a paginated list of jobs. Public users only see published jobs. Admins can filter by published status and see all jobs.',
  })
  @ApiOkResponse({
    description: 'Paginated list of jobs',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            slug: 'senior-structural-engineer',
            title: 'Senior Structural Engineer',
            location: 'Lagos, Nigeria',
            employmentType: 'Full-time',
            department: 'Engineering',
            description:
              'We are looking for an experienced structural engineer...',
            isPublished: true,
            _count: { applications: 12 },
          },
        ],
        total: 25,
        meta: {
          total: 25,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'Lagos',
    description: 'Filter by job location',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    example: 'Engineering',
    description: 'Filter by department',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    example: 'Full-time',
    description: 'Filter by employment type',
  })
  @ApiQuery({
    name: 'published',
    required: false,
    description:
      'Filter by published status (admin only). Use "true" or "false"',
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
  @ApiBadRequestResponse({
    description: 'Validation error - invalid pagination parameters',
  })
  async list(
    @Query('location') location?: string,
    @Query('department') department?: string,
    @Query('type') type?: string,
    @Query('published') published?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const publishedFilter =
      published === 'true' ? true : published === 'false' ? false : undefined;
    return this.careersService.list(
      { location, department, type, published: publishedFilter },
      Number(page),
      Number(limit),
    );
  }

  @Get('public')
  @ApiOperation({
    summary: 'List only published jobs (legacy endpoint)',
    description:
      'DEPRECATED: Use /careers endpoint instead. This endpoint remains for backward compatibility. Returns only published jobs for public view.',
  })
  @ApiOkResponse({
    description: 'Paginated list of published jobs',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            slug: 'senior-structural-engineer',
            title: 'Senior Structural Engineer',
            location: 'Lagos, Nigeria',
            employmentType: 'Full-time',
            department: 'Engineering',
            description:
              'We are looking for an experienced structural engineer...',
          },
        ],
        total: 15,
        page: 1,
        pageSize: 20,
      },
    },
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'Lagos',
    description: 'Filter by job location',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    example: 'Engineering',
    description: 'Filter by department',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    example: 'Full-time',
    description: 'Filter by employment type',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    example: 20,
    description: 'Items per page',
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid pagination parameters',
  })
  async listPublished(
    @Query('location') location?: string,
    @Query('department') department?: string,
    @Query('type') type?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const { page, pageSize, skip, take } = getPagination(pagination ?? {});
    const result = await this.careersService.listPublished(
      { location, department, type },
      { skip, take },
    );
    return { ...result, page, pageSize };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job statistics retrieved successfully')
  @ApiOperation({
    summary: 'Get job statistics (admin)',
    description:
      'Retrieve aggregated statistics about all jobs including counts by department, location, and employment type. Requires admin authentication.',
  })
  @ApiOkResponse({
    description: 'Job statistics by department, location, and type',
    schema: {
      example: {
        total: 25,
        published: 18,
        byDepartment: [
          { department: 'Engineering', _count: 12 },
          { department: 'Design', _count: 8 },
          { department: 'Management', _count: 5 },
        ],
        byLocation: [
          { location: 'Lagos', _count: 15 },
          { location: 'Abuja', _count: 6 },
          { location: 'Port Harcourt', _count: 4 },
        ],
        byType: [
          { employmentType: 'Full-time', _count: 18 },
          { employmentType: 'Contract', _count: 4 },
          { employmentType: 'Internship', _count: 3 },
        ],
      },
    },
  })
  getStats() {
    return this.careersService.getStats();
  }

  // Admin: get job by ID or slug (includes unpublished)
  @Get('identifier/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job retrieved successfully')
  @ApiOperation({
    summary: 'Get job by ID or slug (admin)',
    description:
      'Retrieve job details including unpublished ones. Accepts either MongoDB ID or slug. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Either a MongoDB ObjectId (24 hex) or a job slug',
    example: 'senior-structural-engineer or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Job details with application count',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        slug: 'senior-structural-engineer',
        title: 'Senior Structural Engineer',
        location: 'Lagos, Nigeria',
        employmentType: 'Full-time',
        department: 'Engineering',
        description: 'We are looking for an experienced structural engineer...',
        requirements: "Bachelor's degree...",
        responsibilities: 'Design and analyze structural systems...',
        isPublished: false,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        _count: { applications: 12 },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job not found with the given identifier',
  })
  findByIdentifier(@Param('identifier') identifier: string) {
    return this.careersService.findByIdentifier(identifier);
  }

  // Public: get published job by ID or slug
  @Get(':identifier')
  @ResponseMessage('Job retrieved successfully')
  @ApiOperation({
    summary: 'Get published job by ID or slug (public)',
    description:
      'Public endpoint to retrieve job details. Only returns jobs that are published. If using an ID, the job must be published to be accessible.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Either a MongoDB ObjectId (24 hex) or a job slug',
    example: 'senior-structural-engineer or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Published job details',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        slug: 'senior-structural-engineer',
        title: 'Senior Structural Engineer',
        location: 'Lagos, Nigeria',
        employmentType: 'Full-time',
        department: 'Engineering',
        description: 'We are looking for an experienced structural engineer...',
        requirements:
          "Bachelor's degree in Civil/Structural Engineering with at least 5 years experience...",
        responsibilities:
          'Design and analyze structural systems, supervise construction, ensure compliance with building codes...',
        isPublished: true,
        publishedAt: '2024-01-11T10:00:00Z',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job not found or not published',
  })
  getPublicByIdentifier(@Param('identifier') identifier: string) {
    return this.careersService.findPublicByIdentifier(identifier);
  }

  @Put('identifier/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job posting updated successfully')
  @ApiOperation({
    summary: 'Update a job posting',
    description:
      'Update job details including title, description, requirements, etc. Note that updating the title will auto-generate a new slug. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Job MongoDB ID or current slug',
    example: 'senior-structural-engineer or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Job updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        slug: 'senior-structural-engineer', // may change if title changed
        title: 'Senior Structural Engineer (Updated)',
        location: 'Lagos, Nigeria',
        employmentType: 'Full-time',
        department: 'Engineering',
        description: 'Updated job description...',
        requirements: 'Updated requirements...',
        responsibilities: 'Updated responsibilities...',
        isPublished: true,
        updatedAt: '2024-01-16T14:20:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job not found with the given identifier',
  })
  update(@Param('identifier') identifier: string, @Body() dto: CreateJobDto) {
    return this.careersService.update(identifier, dto);
  }

  @Delete('identifier/:identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job posting deleted successfully')
  @ApiOperation({
    summary: 'Delete a job posting',
    description:
      'Permanently deletes a job posting and all associated applications. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Job MongoDB ID or slug',
    example: 'senior-structural-engineer or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Job deleted successfully',
    schema: {
      example: { message: 'Job deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job not found with the given identifier',
  })
  remove(@Param('identifier') identifier: string) {
    return this.careersService.remove(identifier);
  }

  @Post('identifier/:identifier/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job posting published successfully')
  @ApiOperation({
    summary: 'Publish a job posting',
    description:
      'Makes a job visible to job seekers on the careers page. Sets isPublished=true. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Job MongoDB ID or slug',
    example: 'senior-structural-engineer or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Job published successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        slug: 'senior-structural-engineer',
        title: 'Senior Structural Engineer',
        isPublished: true,
        publishedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job not found with the given identifier',
  })
  publish(@Param('identifier') identifier: string) {
    return this.careersService.publish(identifier);
  }

  @Post('identifier/:identifier/unpublish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Job posting unpublished successfully')
  @ApiOperation({
    summary: 'Unpublish a job posting',
    description:
      'Removes a job from public view on the careers page. Sets isPublished=false. Requires admin authentication.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Job MongoDB ID or slug',
    example: 'senior-structural-engineer or 65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Job unpublished successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        slug: 'senior-structural-engineer',
        title: 'Senior Structural Engineer',
        isPublished: false,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job not found with the given identifier',
  })
  unpublish(@Param('identifier') identifier: string) {
    return this.careersService.unpublish(identifier);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Search Endpoints')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ResponseMessage('Global search completed successfully')
  @ApiOperation({
    summary: 'Global search across all entities',
    description:
      'Perform a unified search across projects, services, jobs, and applications (admin only for applications). Results are grouped by entity type.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'architectural design',
    description:
      'Search query - matches against titles, descriptions, locations, etc.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['projects', 'services', 'jobs', 'applications'],
    description: 'Filter results to specific entity type (omit for all types)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page per type (default: 20)',
  })
  @ApiOkResponse({
    description: 'Global search results grouped by entity type',
    schema: {
      example: {
        projects: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            title: 'Modern Family Villa',
            slug: 'modern-family-villa',
            location: 'Lekki, Lagos',
            category: 'RESIDENTIAL',
            type: 'COMPLETED',
            description: 'A contemporary villa designed for comfort.',
          },
        ],
        services: [
          {
            id: '65f34e7e0a2b3c4d5e6f7800',
            name: 'Architectural Design',
            slug: 'architectural-design',
            shortDescription: 'We design beautiful and functional spaces.',
          },
        ],
        jobs: [
          {
            id: '65f34e7e0a2b3c4d5e6f7810',
            title: 'Senior Structural Engineer',
            slug: 'senior-structural-engineer',
            location: 'Lagos',
            department: 'Engineering',
            employmentType: 'Full-time',
          },
        ],
        applications: [
          {
            id: '65f34e7e0a2b3c4d5e6f7820',
            fullName: 'Ada Lovelace',
            email: 'ada@example.com',
            status: 'NEW',
            job: { title: 'Senior Structural Engineer' },
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Missing required search query (q parameter)',
  })
  globalSearch(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.globalSearch(
      query,
      type,
      Number(page),
      Number(limit),
    );
  }

  @Get('projects')
  @ResponseMessage('Project search completed successfully')
  @ApiOperation({
    summary: 'Search projects',
    description:
      'Search published projects with optional filters. Results can be filtered by category, type, location, and featured status.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'villa residential',
    description: 'Search query - matches title and description',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'],
    description: 'Filter by project category',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['COMPLETED', 'PLAN_TO_BUY'],
    description: 'Filter by project type',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'Lagos',
    description: 'Filter by location (case-insensitive, partial match)',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    description: 'Filter by featured status - use "true" or "false"',
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
    description: 'Project search results',
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
          },
        ],
        total: 15,
        meta: {
          total: 15,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  searchProjects(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('featured') featured?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchProjects(
      query,
      {
        category,
        type,
        location,
        featured: featured === 'true' ? true : undefined,
      },
      Number(page),
      Number(limit),
    );
  }

  @Get('services')
  @ResponseMessage('Service search completed successfully')
  @ApiOperation({
    summary: 'Search services',
    description:
      'Search services by name, short description, or detailed description.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'architectural design',
    description: 'Search query - matches service name and descriptions',
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
    description: 'Service search results',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7800',
            name: 'Architectural Design',
            slug: 'architectural-design',
            shortDescription: 'We design beautiful and functional spaces.',
            order: 1,
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
  searchServices(
    @Query('q') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchServices(
      query,
      Number(page),
      Number(limit),
    );
  }

  @Get('jobs')
  @ResponseMessage('Job search completed successfully')
  @ApiOperation({
    summary: 'Search jobs',
    description:
      'Search job postings by title, description, requirements, or responsibilities. Can filter by department, location, employment type, and published status.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'structural engineer',
    description:
      'Search query - matches title, description, requirements, responsibilities',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    example: 'Engineering',
    description: 'Filter by department (case-insensitive, partial match)',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'Lagos',
    description: 'Filter by location (case-insensitive, partial match)',
  })
  @ApiQuery({
    name: 'employmentType',
    required: false,
    example: 'Full-time',
    description: 'Filter by employment type',
  })
  @ApiQuery({
    name: 'published',
    required: false,
    description:
      'Filter by published status - use "true" for published jobs only, "false" for draft jobs',
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
    description: 'Job search results',
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
        total: 8,
        meta: {
          total: 8,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  searchJobs(
    @Query('q') query: string,
    @Query('department') department?: string,
    @Query('location') location?: string,
    @Query('employmentType') employmentType?: string,
    @Query('published') published?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchJobs(
      query,
      {
        department,
        location,
        employmentType,
        published: published === 'true' ? true : undefined,
      },
      Number(page),
      Number(limit),
    );
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Application search completed successfully')
  @ApiOperation({
    summary: 'Search job applications',
    description:
      'Search job applications by applicant name or email. Supports filtering by status and job. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'john doe',
    description: 'Search query - matches applicant full name and email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['NEW', 'IN_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED'],
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    example: '65f34e7e0a2b3c4d5e6f7890',
    description: 'Filter by job MongoDB ID',
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
    description: 'Application search results',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '+2348012345678',
            status: 'NEW',
            createdAt: '2024-01-15T14:30:00Z',
            job: {
              id: '65f34e7e0a2b3c4d5e6f7891',
              title: 'Senior Structural Engineer',
              department: 'Engineering',
              location: 'Lagos, Nigeria',
            },
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
  searchApplications(
    @Query('q') query: string,
    @Query('status') status?: string,
    @Query('jobId') jobId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchApplications(
      query,
      {
        status,
        jobId,
      },
      Number(page),
      Number(limit),
    );
  }

  @Get('suggestions')
  @ResponseMessage('Search suggestions retrieved successfully')
  @ApiOperation({
    summary: 'Get search suggestions',
    description:
      'Retrieve autocomplete suggestions based on project titles, service names, and job titles. Useful for search typeahead functionality.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    example: 'arch',
    description: 'Partial search query for autocomplete',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 5,
    description: 'Maximum number of suggestions (default: 5, max: 20)',
  })
  @ApiOkResponse({
    description: 'Search suggestions array',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: [
        'Architectural Design',
        'Architectural Plans',
        'Architecture Services',
      ],
    },
  })
  getSuggestions(@Query('q') query: string, @Query('limit') limit = 5) {
    return this.searchService.searchSuggestions(query, Number(limit));
  }
}

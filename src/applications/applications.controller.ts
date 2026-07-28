import { Body, Controller, Get, Post, Put, Delete, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiProperty,
  ApiBearerAuth,
  ApiParam,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';
import { IsEmail, IsOptional, IsString, IsDateString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobApplicationStatus } from '@prisma/client';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationsDto } from './dto/bulk-update-applications.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

class CreateApplicationDto {
  @IsString()
  @ApiProperty({ example: '65f34e7e0a2b3c4d5e6f7890' })
  jobId: string;

  @IsString()
  @ApiProperty({ example: 'Ada Lovelace' })
  fullName: string;

  @IsEmail()
  @ApiProperty({ example: 'ada@example.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '+2348012345678' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'I am excited to apply...' })
  coverLetter?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    example: 'https://cdn.example.com/cv/ada-lovelace.pdf',
  })
  cvUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'cvs/ada-lovelace.pdf' })
  cvS3Key?: string;
}

class DateRangeQueryDto {
  @IsDateString()
  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @IsDateString()
  @ApiProperty({ example: '2024-12-31' })
  endDate: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '65f34e7e0a2b3c4d5e6f7890' })
  jobId?: string;
}

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ResponseMessage('Application submitted successfully')
  @ApiOperation({
    summary: 'Submit a job application',
    description:
      'Public endpoint for candidates to submit job applications. Applications can include CV URL/S3 key, cover letter, and contact information.',
  })
  @ApiCreatedResponse({
    description: 'Job application submitted successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        jobId: '65f34e7e0a2b3c4d5e6f7891',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+2348012345678',
        coverLetter: 'I am excited to apply for this position...',
        cvUrl: 'https://cdn.example.com/cv/ada-lovelace.pdf',
        cvS3Key: 'cvs/ada-lovelace.pdf',
        status: 'NEW',
        notes: null,
        createdAt: '2024-01-15T14:30:00Z',
        job: {
          id: '65f34e7e0a2b3c4d5e6f7891',
          title: 'Senior Structural Engineer',
          slug: 'senior-structural-engineer',
          department: 'Engineering',
          location: 'Lagos, Nigeria',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - jobId, fullName, and email are required',
  })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Applications retrieved successfully')
  @ApiOperation({
    summary: 'List all applications with advanced filtering (admin)',
    description:
      'Retrieve a paginated list of all job applications with comprehensive filtering options. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: 'Filter by specific job MongoDB ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
    enum: JobApplicationStatus,
  })
  @ApiQuery({
    name: 'department',
    required: false,
    description: 'Filter by job department (case-insensitive, partial match)',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by job location (case-insensitive, partial match)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in applicant full name and email (case-insensitive, partial match)',
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
    description: 'Paginated list of applications with job details',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            fullName: 'Ada Lovelace',
            email: 'ada@example.com',
            phone: '+2348012345678',
            coverLetter: 'I am excited to apply...',
            cvUrl: 'https://cdn.example.com/cv/ada-lovelace.pdf',
            cvS3Key: 'cvs/ada-lovelace.pdf',
            status: 'NEW',
            notes: null,
            createdAt: '2024-01-15T14:30:00Z',
            job: {
              id: '65f34e7e0a2b3c4d5e6f7891',
              title: 'Senior Structural Engineer',
              slug: 'senior-structural-engineer',
              department: 'Engineering',
              location: 'Lagos, Nigeria',
              employmentType: 'Full-time',
            },
          },
        ],
        total: 150,
        meta: {
          total: 150,
          page: 1,
          limit: 20,
          totalPages: 8,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - invalid pagination parameters',
  })
  async list(
    @Query('jobId') jobId?: string,
    @Query('status') status?: JobApplicationStatus,
    @Query('department') department?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.applicationsService.list(
      { jobId, status, department, location, search },
      Number(page),
      Number(limit),
    );
  }

  @Get('for-job')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Applications for job retrieved successfully')
  @ApiOperation({
    summary: 'List applications for a specific job (legacy endpoint)',
    description:
      'DEPRECATED: Use /applications endpoint with jobId filter instead. Returns applications for a specific job. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'jobId',
    required: true,
    description: 'MongoDB ID of the job',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status or use "ALL" for all statuses',
    enum: JobApplicationStatus,
  })
  @ApiOkResponse({
    description: 'Paginated list of applications',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            fullName: 'Ada Lovelace',
            email: 'ada@example.com',
            status: 'NEW',
            createdAt: '2024-01-15T14:30:00Z',
          },
        ],
        total: 12,
        page: 1,
        pageSize: 20,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - jobId is required and pagination must be valid numbers',
  })
  async listForJob(
    @Query('jobId') jobId: string,
    @Query('status') status?: string,
    @Query() pagination?: PaginationDto,
  ) {
    const { page, pageSize, skip, take } = getPagination(pagination ?? {});
    const mappedStatus =
      status && status.toUpperCase() !== 'ALL'
        ? (status.toUpperCase() as any)
        : undefined;
    const result = await this.applicationsService.listForJob(jobId, mappedStatus, {
      skip,
      take,
    });
    return { ...result, page, pageSize };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Application statistics retrieved successfully')
  @ApiOperation({
    summary: 'Get application statistics (admin)',
    description:
      'Retrieve aggregated statistics about job applications including counts by status and optionally breakdown by job. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: 'Get stats for a specific job only (omit for overall stats)',
  })
  @ApiOkResponse({
    description: 'Application statistics by status and job',
    schema: {
      example: {
        total: 150,
        byStatus: [
          { status: 'NEW', _count: 45 },
          { status: 'IN_REVIEW', _count: 60 },
          { status: 'SHORTLISTED', _count: 25 },
          { status: 'REJECTED', _count: 15 },
          { status: 'HIRED', _count: 5 },
        ],
        byJob: [
          { jobId: '65f34e7e0a2b3c4d5e6f7891', _count: 45 },
          { jobId: '65f34e7e0a2b3c4d5e6f7892', _count: 30 },
        ],
        recentApplications: 12,
      },
    },
  })
  getStats(@Query('jobId') jobId?: string) {
    return this.applicationsService.getStats(jobId);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Applications exported successfully')
  @ApiOperation({
    summary: 'Export applications to CSV/JSON (admin)',
    description:
      'Export job applications as array data (can be converted to CSV/JSON). Supports filtering by job and status. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: 'Export applications for a specific job only',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: JobApplicationStatus,
    description: 'Filter by application status',
  })
  @ApiOkResponse({
    description: 'Array of applications matching criteria',
    schema: {
      type: 'array',
      example: [
        {
          id: '65f34e7e0a2b3c4d5e6f7890',
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          phone: '+2348012345678',
          coverLetter: 'I am excited to apply...',
          cvS3Key: 'cvs/ada-lovelace.pdf',
          cvUrl: 'https://cdn.example.com/cv/ada-lovelace.pdf',
          status: 'NEW',
          notes: null,
          createdAt: '2024-01-15T14:30:00Z',
          job: {
            title: 'Senior Structural Engineer',
            department: 'Engineering',
            location: 'Lagos, Nigeria',
            employmentType: 'Full-time',
          },
        },
      ],
    },
  })
  exportApplications(
    @Query('jobId') jobId?: string,
    @Query('status') status?: JobApplicationStatus,
  ) {
    return this.applicationsService.exportApplications(jobId, status);
  }

  @Get('date-range')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Applications by date range retrieved successfully')
  @ApiOperation({
    summary: 'Get applications within date range (admin)',
    description:
      'Retrieve all applications created between two dates (inclusive). Useful for reporting and analytics. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date in ISO format (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date in ISO format (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: 'Optional job ID filter within the date range',
  })
  @ApiOkResponse({
    description: 'Applications within specified date range',
    schema: {
      type: 'array',
      example: [
        {
          id: '65f34e7e0a2b3c4d5e6f7890',
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          status: 'NEW',
          createdAt: '2024-01-15T14:30:00Z',
          job: {
            title: 'Senior Structural Engineer',
            department: 'Engineering',
          },
        },
      ],
    },
  })
  getByDateRange(@Query() query: DateRangeQueryDto) {
    return this.applicationsService.getApplicationsByDateRange(
      new Date(query.startDate),
      new Date(query.endDate),
      query.jobId,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Application retrieved successfully')
  @ApiOperation({
    summary: 'Get application by ID (admin)',
    description: 'Retrieve full application details including attached CV and job information. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the application',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Application details with job information',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+2348012345678',
        coverLetter: 'I am excited to apply...',
        cvUrl: 'https://cdn.example.com/cv/ada-lovelace.pdf',
        cvS3Key: 'cvs/ada-lovelace.pdf',
        status: 'NEW',
        notes: null,
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        job: {
          id: '65f34e7e0a2b3c4d5e6f7891',
          title: 'Senior Structural Engineer',
          slug: 'senior-structural-engineer',
          department: 'Engineering',
          location: 'Lagos, Nigeria',
          employmentType: 'Full-time',
          description: 'We are looking for...',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Application not found',
  })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Application updated successfully')
  @ApiOperation({
    summary: 'Update application status and notes (admin)',
    description:
      'Update an application\'s status and optionally add internal notes. Status changes: NEW → IN_REVIEW → SHORTLISTED/HIRED/REJECTED. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the application',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Application updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        status: 'IN_REVIEW',
        notes: 'Strong technical background, good fit for the role.',
        updatedAt: '2024-01-16T10:15:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Application not found',
  })
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Put('bulk-update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Applications updated successfully')
  @ApiOperation({
    summary: 'Bulk update application status (admin)',
    description:
      'Update status for multiple applications at once. Useful for batch operations like moving many candidates to "SHORTLISTED". Requires admin authentication.',
  })
  @ApiOkResponse({
    description: 'Applications updated successfully',
    schema: {
      example: {
        message: 'Updated 15 applications to SHORTLISTED',
        updatedCount: 15,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid application IDs provided',
  })
  bulkUpdate(@Body() dto: BulkUpdateApplicationsDto) {
    return this.applicationsService.bulkUpdate(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Application deleted successfully')
  @ApiOperation({
    summary: 'Delete an application (admin)',
    description: 'Permanently removes an application from the system. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the application to delete',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Application deleted successfully',
    schema: {
      example: { message: 'Application deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Application not found',
  })
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}



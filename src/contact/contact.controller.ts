import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiProperty,
} from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { EmailService } from './email.service';

class ContactDto {
  @IsString()
  @ApiProperty({ example: 'Grace Hopper' })
  name: string;

  @IsEmail()
  @ApiProperty({ example: 'grace@example.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '+2348012345678' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'RIEC Ltd.' })
  company?: string;

  @IsString()
  @MaxLength(2000)
  @ApiProperty({ example: 'Hello, I would like to request a quote...' })
  message: string;
}

class QuoteRequestDto {
  @IsString()
  @ApiProperty({ example: 'New build' })
  projectType: string;

  @IsString()
  @ApiProperty({ example: 'Nairobi, Kenya' })
  location: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'Q3 2026' })
  timeline?: string;

  @IsString()
  @ApiProperty({ example: '$100k - $250k' })
  budgetRange: string;

  @IsString()
  @ApiProperty({ example: 'Architecture, Construction' })
  servicesNeeded: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '500' })
  size?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '2' })
  floors?: string;

  @IsString()
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'Acme Corp' })
  company?: string;

  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '+1234567890' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiProperty({ required: false, example: 'Additional details...' })
  notes?: string;
}

@ApiTags('Contact Us Endpoints')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @ResponseMessage('Contact submission created successfully')
  @ApiOperation({
    summary: 'Submit a contact form',
    description:
      'Public endpoint for submitting contact form inquiries. All fields except phone and company are required. Submissions are stored and accessible to admins via the admin endpoint.',
  })
  @ApiOkResponse({
    description: 'Contact submission created successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        phone: '+2348012345678',
        company: 'RIEC Ltd.',
        message:
          'Hello, I would like to request a quote for a residential project.',
        read: false,
        createdAt: '2024-01-15T14:30:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - name, email, and message are required',
  })
  create(@Body() dto: ContactDto) {
    return this.prisma.contactSubmission.create({ data: dto });
  }

  @Post('quote')
  @ResponseMessage('Quote request sent successfully')
  @ApiOperation({
    summary: 'Send a quote request email',
    description:
      'Public endpoint for sending quote request emails via Resend. This endpoint does not store the data but directly sends an email to the configured recipient.',
  })
  @ApiOkResponse({
    description: 'Quote request email sent successfully',
    schema: {
      example: {
        success: true,
        message: 'Quote request email sent successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - required fields are missing',
  })
  async sendQuoteEmail(@Body() dto: QuoteRequestDto) {
    const result = await this.emailService.sendQuoteEmail(dto);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return {
      success: true,
      message: 'Quote request email sent successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/submissions')
  @ApiBearerAuth()
  @ResponseMessage('Contact submissions retrieved successfully')
  @ApiOperation({
    summary: 'List contact submissions (admin)',
    description:
      'Retrieve a paginated list of all contact form submissions. Requires admin authentication.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    example: 20,
    description: 'Items per page (default: 20)',
  })
  @ApiOkResponse({
    description:
      'Paginated list of contact submissions ordered by newest first',
    schema: {
      example: {
        data: [
          {
            id: '65f34e7e0a2b3c4d5e6f7890',
            name: 'Grace Hopper',
            email: 'grace@example.com',
            phone: '+2348012345678',
            company: 'RIEC Ltd.',
            message: 'Hello, I would like to request a quote...',
            read: false,
            createdAt: '2024-01-15T14:30:00Z',
          },
        ],
        total: 45,
        page: 1,
        pageSize: 20,
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Validation error - pagination parameters must be valid numbers',
  })
  async list(@Query() pagination?: PaginationDto) {
    const { page, pageSize, skip, take } = getPagination(pagination ?? {});
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contactSubmission.count(),
    ]);
    return { data: items, total, page, pageSize };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/submissions/:id/read')
  @ApiBearerAuth()
  @ResponseMessage('Submission marked as read successfully')
  @ApiOperation({
    summary: 'Mark a contact submission as read (admin)',
    description:
      'Mark a contact submission as read to track which inquiries have been addressed. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the contact submission',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'Submission marked as read',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        read: true,
        updatedAt: '2024-01-16T09:15:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid submission ID',
  })
  markRead(@Param('id') id: string) {
    return this.prisma.contactSubmission.update({
      where: { id },
      data: { read: true },
    });
  }
}

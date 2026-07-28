/* eslint-disable prettier/prettier */
import {
  Controller, Get, Post, Put, Delete, Param, Body, Query,
  UploadedFiles, UseInterceptors, Req, UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiParam, ApiConsumes, ApiBody, ApiQuery, ApiBearerAuth,
  ApiCreatedResponse, ApiOkResponse, ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProjectAssetsService } from './project-assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ProjectDocumentType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Project Assets (Project related Documents) Endpoints')
@Controller('projects/:projectId/assets')
export class ProjectAssetsController {
  constructor(private readonly service: ProjectAssetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Assets uploaded successfully')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload one or more assets for a project',
    description:
      'Upload documents/assets for a project. Assets can optionally be linked to a pricing tier. Common document types include presentations, drawings, reports, contracts, etc. Max 20 files per request. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiBody({
    description: 'Multipart form data with files and asset metadata',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Document files (PDF, DWG, images, etc.)',
        },
        documentType: {
          type: 'string',
          enum: Object.values(ProjectDocumentType),
          description: 'Type of document being uploaded',
        },
        tierId: {
          type: 'string',
          description: 'Optional: Link this asset to a specific pricing tier',
        },
        version: {
          type: 'string',
          example: 'v1',
          description: 'Optional version identifier',
        },
      },
      example: {
        files: ['file1.pdf', 'file2.dwg'],
        documentType: 'ARCHITECTURAL_DRAWINGS',
        tierId: '65f34e7e0a2b3c4d5e6f7892',
        version: 'v1',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Assets uploaded successfully',
    schema: {
      type: 'array',
      example: [
        {
          id: 'asset1',
          projectId: '65f34e7e0a2b3c4d5e6f7890',
          tierId: '65f34e7e0a2b3c4d5e6f7892',
          documentType: 'ARCHITECTURAL_DRAWINGS',
          version: 'v1',
          s3Key: 'projects/123/drawings/plan.pdf',
          filename: 'architectural-plan.pdf',
          fileType: 'application/pdf',
          size: 2048576,
          isDownloadable: true,
          uploadedBy: {
            id: 'user1',
            email: 'admin@example.com',
          },
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
    },
  })
  upload(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: any[],
    @Body() dto: CreateAssetDto,
    @Req() req: any,
  ) {
    const userId: string | undefined = req.user?.userId ?? req.user?.sub;
    return this.service.upload(projectId, files, dto, userId);
  }

  @Get()
  @ResponseMessage('Project assets retrieved successfully')
  @ApiOperation({
    summary: 'List assets for a project',
    description:
      'Retrieve a paginated list of assets/documents for a project. Supports filtering by document type and pricing tier.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiQuery({
    name: 'tierId',
    required: false,
    description: 'Filter by pricing tier MongoDB ID',
  })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: ProjectDocumentType,
    description: 'Filter by document type',
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
    description: 'Paginated list of project assets',
    schema: {
      example: {
        data: [
          {
            id: 'asset1',
            projectId: '65f34e7e0a2b3c4d5e6f7890',
            tierId: '65f34e7e0a2b3c4d5e6f7892',
            documentType: 'ARCHITECTURAL_DRAWINGS',
            version: 'v1',
            s3Key: 'projects/123/drawings/plan.pdf',
            filename: 'architectural-plan.pdf',
            fileType: 'application/pdf',
            size: 2048576,
            isDownloadable: true,
            uploadedBy: {
              id: 'user1',
              email: 'admin@example.com',
            },
            createdAt: '2024-01-15T10:30:00Z',
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
  list(
    @Param('projectId') projectId: string,
    @Query('tierId') tierId?: string,
    @Query('documentType') documentType?: ProjectDocumentType,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.list(projectId, { tierId, documentType }, Number(page), Number(limit));
  }

  @Get(':assetId')
  @ResponseMessage('Asset retrieved successfully')
  @ApiOperation({
    summary: 'Get a single asset',
    description: 'Retrieve detailed information about a specific asset including download metadata.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'assetId',
    description: 'MongoDB ObjectId of the asset',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiOkResponse({
    description: 'Asset details',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7891',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        tierId: '65f34e7e0a2b3c4d5e6f7892',
        documentType: 'ARCHITECTURAL_DRAWINGS',
        version: 'v1',
        s3Key: 'projects/123/drawings/plan.pdf',
        filename: 'architectural-plan.pdf',
        fileType: 'application/pdf',
        size: 2048576,
        isDownloadable: true,
        uploadedBy: {
          id: 'user1',
          email: 'admin@example.com',
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Asset not found or does not belong to the project',
  })
  findOne(@Param('projectId') projectId: string, @Param('assetId') assetId: string) {
    return this.service.findOne(projectId, assetId);
  }

  @Put(':assetId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Asset updated successfully')
  @ApiOperation({
    summary: 'Update asset metadata (isDownloadable, version)',
    description:
      'Update asset properties such as download permissions and version label. Does not replace the file - for replacement, upload a new asset. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'assetId',
    description: 'MongoDB ObjectId of the asset',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiBody({
    description: 'Asset metadata to update (both fields optional)',
    schema: {
      type: 'object',
      properties: {
        isDownloadable: {
          type: 'boolean',
          description: 'Whether the asset can be downloaded by customers',
        },
        version: {
          type: 'string',
          example: 'v2',
          description: 'Version identifier',
        },
      },
      example: { isDownloadable: true, version: 'v2' },
    },
  })
  @ApiOkResponse({
    description: 'Asset updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7891',
        isDownloadable: true,
        version: 'v2',
        updatedAt: '2024-01-16T14:20:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Asset not found or does not belong to the project',
  })

  @Delete(':assetId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Asset deleted successfully')
  @ApiOperation({
    summary: 'Delete a project asset',
    description: 'Permanently delete an asset from a project. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'assetId',
    description: 'MongoDB ObjectId of the asset',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiOkResponse({
    description: 'Asset deleted successfully',
    schema: {
      example: { message: 'Asset deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Asset not found or does not belong to the project',
  })
  remove(@Param('projectId') projectId: string, @Param('assetId') assetId: string) {
    return this.service.remove(projectId, assetId);
  }

  @Get(':assetId/download')
  @ResponseMessage('Download URL generated successfully')
  @ApiOperation({
    summary: 'Get a signed download URL for an asset',
    description:
      'Generate a time-limited signed URL for downloading an asset. The asset must have isDownloadable=true. Used by customers who have purchased access to the tier-linked assets.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'assetId',
    description: 'MongoDB ObjectId of the asset',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiOkResponse({
    description: 'Signed download URL (temporary access)',
    schema: {
      example: {
        downloadUrl: 'https://cdn.example.com/projects/123/plan.pdf?X-Amz-Expires=3600&Signature=...',
        expiresIn: 3600,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Asset not found, not downloadable, or does not belong to the project',
  })
  download(@Param('projectId') projectId: string, @Param('assetId') assetId: string) {
    return this.service.getDownloadUrl(projectId, assetId);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectImagesService } from './project-images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Project Images (Project related Documents) Endpoints')
@Controller('projects/:projectId/images')
export class ProjectImagesController {
  constructor(private readonly service: ProjectImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project images uploaded successfully')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload images for a project',
    description:
      'Upload one or more images for a project. Images are automatically ordered by their position in the upload batch. Optional captions can be provided. Max 20 files per request. Requires admin authentication.',
  })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiBody({
    description: 'Multipart form data with files and optional captions',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Image files (JPEG, PNG, WebP recommended)',
        },
        captions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional captions for each image in order',
        },
      },
      example: {
        files: ['file1.jpg', 'file2.jpg'],
        captions: ['Front view', 'Side view'],
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Images uploaded successfully',
    schema: {
      type: 'array',
      example: [
        {
          id: 'img1',
          projectId: '65f34e7e0a2b3c4d5e6f7890',
          s3Key: 'projects/2024/01/image1.jpg',
          url: 'https://cdn.example.com/projects/2024/01/image1.jpg',
          caption: 'Front view',
          order: 0,
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
    },
  })
  upload(
    @Param('projectId') projectId: string,
    @UploadedFiles() files: any[],
    @Body('captions') captions?: string | string[],
  ) {
    const captionsArr = captions
      ? Array.isArray(captions)
        ? captions
        : [captions]
      : undefined;
    return this.service.upload(projectId, files, captionsArr);
  }

  @Get()
  @ResponseMessage('Project images retrieved successfully')
  @ApiOperation({
    summary: 'List images for a project',
    description:
      'Retrieve all images for a project, automatically ordered by position/sort order.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'List of project images ordered by position',
    schema: {
      type: 'array',
      example: [
        {
          id: 'img1',
          projectId: '65f34e7e0a2b3c4d5e6f7890',
          s3Key: 'projects/2024/01/image1.jpg',
          url: 'https://cdn.example.com/projects/2024/01/image1.jpg',
          caption: 'Front view',
          order: 0,
        },
        {
          id: 'img2',
          projectId: '65f34e7e0a2b3c4d5e6f7890',
          s3Key: 'projects/2024/01/image2.jpg',
          url: 'https://cdn.example.com/projects/2024/01/image2.jpg',
          caption: 'Side view',
          order: 1,
        },
      ],
    },
  })
  list(@Param('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project images reordered successfully')
  @ApiOperation({
    summary: 'Reorder project images',
    description:
      'Update the order of project images by providing an array of image IDs in the desired sequence. All provided IDs must belong to the project. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiBody({
    description: 'Array of image IDs in desired order',
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Image IDs ordered by new position',
        },
      },
      example: { ids: ['img1', 'img2', 'img3'] },
    },
  })
  @ApiOkResponse({
    description: 'Images reordered successfully',
    schema: {
      type: 'array',
      example: [
        { id: 'img1', order: 0 },
        { id: 'img2', order: 1 },
        { id: 'img3', order: 2 },
      ],
    },
  })
  reorder(@Param('projectId') projectId: string, @Body('ids') ids: string[]) {
    return this.service.reorder(projectId, ids);
  }

  @Put(':imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project image updated successfully')
  @ApiOperation({
    summary: 'Update image caption or order',
    description:
      "Update an image's caption and/or its order position within the project. Requires admin authentication.",
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'imageId',
    description: 'MongoDB ObjectId of the image',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiOkResponse({
    description: 'Image updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7891',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        caption: 'Updated caption',
        order: 0,
        updatedAt: '2024-01-16T11:30:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Image not found or does not belong to the specified project',
  })
  update(
    @Param('projectId') projectId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateImageDto,
  ) {
    return this.service.update(projectId, imageId, dto);
  }

  @Delete(':imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Project image deleted successfully')
  @ApiOperation({
    summary: 'Delete a project image',
    description:
      'Permanently remove an image from a project. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'imageId',
    description: 'MongoDB ObjectId of the image to delete',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiOkResponse({
    description: 'Image deleted successfully',
    schema: {
      example: { message: 'Image deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Image not found or does not belong to the specified project',
  })
  remove(
    @Param('projectId') projectId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.service.remove(projectId, imageId);
  }
}

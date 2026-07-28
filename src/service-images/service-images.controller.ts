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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ServiceImagesService } from './service-images.service';
import { UpdateServiceImageDto } from './dto/update-service-image.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Service Images Endpoints')
@Controller('services/:serviceId/images')
export class ServiceImagesController {
  constructor(private readonly service: ServiceImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Service images uploaded successfully')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload images for a service',
    description:
      'Upload one or more images for a service. Images are ordered by position. Optional captions supported. Max 20 files. Requires admin authentication.',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'MongoDB ObjectId of the service',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiBody({
    description: 'Multipart form data with files and optional captions',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Image files',
        },
        captions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional captions for each image',
        },
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
          serviceId: '65f34e7e0a2b3c4d5e6f7890',
          s3Key: 'services/design1.jpg',
          url: 'https://cdn.example.com/services/design1.jpg',
          caption: 'Example project',
          order: 0,
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  upload(
    @Param('serviceId') serviceId: string,
    @UploadedFiles() files: any[],
    @Body('captions') captions?: string | string[],
  ) {
    const captionsArr = captions
      ? Array.isArray(captions)
        ? captions
        : [captions]
      : undefined;
    return this.service.upload(serviceId, files, captionsArr);
  }

  @Get()
  @ResponseMessage('Service images retrieved successfully')
  @ApiOperation({
    summary: 'List images for a service',
    description: 'Retrieve all images for a service, ordered by position.',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'MongoDB ObjectId of the service',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiOkResponse({
    description: 'List of service images ordered by position',
    schema: {
      type: 'array',
      example: [
        {
          id: 'img1',
          serviceId: '65f34e7e0a2b3c4d5e6f7890',
          s3Key: 'services/design1.jpg',
          url: 'https://cdn.example.com/services/design1.jpg',
          caption: 'Example project',
          order: 0,
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
  })
  list(@Param('serviceId') serviceId: string) {
    return this.service.list(serviceId);
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Service images reordered successfully')
  @ApiOperation({
    summary: 'Reorder service images',
    description:
      'Reorder images by providing a new sequence of image IDs. Requires admin authentication.',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'MongoDB ObjectId of the service',
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
          example: ['img1', 'img2', 'img3'],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Images reordered successfully',
    schema: {
      type: 'array',
      example: [
        { id: 'img1', order: 0 },
        { id: 'img2', order: 1 },
      ],
    },
  })
  reorder(@Param('serviceId') serviceId: string, @Body('ids') ids: string[]) {
    return this.service.reorder(serviceId, ids);
  }

  @Put(':imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Service image updated successfully')
  @ApiOperation({
    summary: 'Update image caption or order',
    description:
      'Update caption and/or order of a service image. Requires admin authentication.',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'MongoDB ObjectId of the service',
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
        serviceId: '65f34e7e0a2b3c4d5e6f7890',
        caption: 'Updated caption',
        order: 0,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Image not found or does not belong to the service',
  })
  update(
    @Param('serviceId') serviceId: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateServiceImageDto,
  ) {
    return this.service.update(serviceId, imageId, dto);
  }

  @Delete(':imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Service image deleted successfully')
  @ApiOperation({
    summary: 'Delete a service image',
    description:
      'Remove an image from a service. Requires admin authentication.',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'MongoDB ObjectId of the service',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'imageId',
    description: 'MongoDB ObjectId of the image',
    example: '65f34e7e0a2b3c4d5e6f7891',
  })
  @ApiOkResponse({
    description: 'Image deleted successfully',
    schema: {
      example: { message: 'Image deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Image not found or does not belong to the service',
  })
  remove(
    @Param('serviceId') serviceId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.service.remove(serviceId, imageId);
  }
}

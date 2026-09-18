import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFiles, 
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryController {
  private readonly logger = new Logger(CloudinaryController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload-multiple')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload multiple images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 20)) // Max 20 files
  async uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    this.logger.log(`📸 Upload multiple images request received`);
    this.logger.log(`   Files count: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate that all files are images
    const invalidFiles = files.filter(file => !file.mimetype.startsWith('image/'));
    if (invalidFiles.length > 0) {
      throw new BadRequestException(`Only image files are allowed. Found: ${invalidFiles.map(f => f.mimetype).join(', ')}`);
    }

    // Validate file sizes (max 10MB per image)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      throw new BadRequestException(`Some files exceed maximum size of 10MB`);
    }

    try {
      // Upload all images to Cloudinary
      const uploadPromises = files.map(file =>
        this.cloudinaryService.uploadFile(
          {
            originalname: file.originalname,
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size,
          },
          'properties/images', // Folder in Cloudinary
        )
      );

      const uploadResults = await Promise.all(uploadPromises);

      this.logger.log(`✅ Successfully uploaded ${uploadResults.length} images`);

      // Return array of image objects with url and publicId
      const images = uploadResults.map(result => ({
        url: result.secureUrl,
        publicId: result.publicId,
        secure_url: result.secureUrl, // For compatibility
        public_id: result.publicId,   // For compatibility
      }));

      return {
        statusCode: 200,
        message: `Successfully uploaded ${images.length} images`,
        data: images,
        urls: images, // For compatibility with frontend
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to upload images: ${error.message}`);
      throw new BadRequestException(`Failed to upload images: ${error.message}`);
    }
  }

  @Post('upload-video')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload videos to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 videos
  async uploadVideos(@UploadedFiles() files: Express.Multer.File[]) {
    this.logger.log(`🎥 Upload videos request received`);
    this.logger.log(`   Files count: ${files?.length || 0}`);

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate that all files are videos
    const invalidFiles = files.filter(file => !file.mimetype.startsWith('video/'));
    if (invalidFiles.length > 0) {
      throw new BadRequestException(`Only video files are allowed. Found: ${invalidFiles.map(f => f.mimetype).join(', ')}`);
    }

    // Validate file sizes (max 100MB per video)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      throw new BadRequestException(`Some files exceed maximum size of 100MB`);
    }

    try {
      // Upload all videos to Cloudinary
      const uploadPromises = files.map(file =>
        this.cloudinaryService.uploadFile(
          {
            originalname: file.originalname,
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: file.size,
          },
          'properties/videos', // Folder in Cloudinary
        )
      );

      const uploadResults = await Promise.all(uploadPromises);

      this.logger.log(`✅ Successfully uploaded ${uploadResults.length} videos`);

      // Return array of video objects with url and publicId
      const videos = uploadResults.map(result => ({
        url: result.secureUrl,
        publicId: result.publicId,
        secure_url: result.secureUrl, // For compatibility
        public_id: result.publicId,   // For compatibility
      }));

      return {
        statusCode: 200,
        message: `Successfully uploaded ${videos.length} videos`,
        data: videos,
        urls: videos, // For compatibility with frontend
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to upload videos: ${error.message}`);
      throw new BadRequestException(`Failed to upload videos: ${error.message}`);
    }
  }
}

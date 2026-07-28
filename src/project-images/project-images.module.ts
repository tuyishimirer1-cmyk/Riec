import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProjectImagesController } from './project-images.controller';
import { ProjectImagesService } from './project-images.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    S3Module,
    MulterModule.register({ limits: { fileSize: 20 * 1024 * 1024 } }),
  ],
  controllers: [ProjectImagesController],
  providers: [ProjectImagesService],
  exports: [ProjectImagesService],
})
export class ProjectImagesModule {}

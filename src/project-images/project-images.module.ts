import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProjectImagesController } from './project-images.controller';
import { ProjectImagesService } from './project-images.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
    MulterModule.register({ limits: { fileSize: 20 * 1024 * 1024 } }),
  ],
  controllers: [ProjectImagesController],
  providers: [ProjectImagesService],
  exports: [ProjectImagesService],
})
export class ProjectImagesModule {}

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ServiceImagesController } from './service-images.controller';
import { ServiceImagesService } from './service-images.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    S3Module,
    MulterModule.register({ limits: { fileSize: 20 * 1024 * 1024 } }),
  ],
  controllers: [ServiceImagesController],
  providers: [ServiceImagesService],
  exports: [ServiceImagesService],
})
export class ServiceImagesModule {}

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProjectAssetsController } from './project-assets.controller';
import { ProjectAssetsService } from './project-assets.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    S3Module,
    MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } }),
  ],
  controllers: [ProjectAssetsController],
  providers: [ProjectAssetsService],
  exports: [ProjectAssetsService],
})
export class ProjectAssetsModule {}

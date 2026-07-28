import { Module } from '@nestjs/common';
import { ProjectPurchasesController } from './project-purchases.controller';
import { ProjectPurchasesService } from './project-purchases.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [ProjectPurchasesController],
  providers: [ProjectPurchasesService],
  exports: [ProjectPurchasesService],
})
export class ProjectPurchasesModule {}

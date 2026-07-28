import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { ProjectPurchasesService } from '../project-purchases/project-purchases.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  controllers: [PurchasesController],
  providers: [ProjectPurchasesService],
  exports: [ProjectPurchasesService],
})
export class PurchasesModule {}

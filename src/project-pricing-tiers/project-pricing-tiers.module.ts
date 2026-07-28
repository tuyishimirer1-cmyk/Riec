import { Module } from '@nestjs/common';
import { ProjectPricingTiersController } from './project-pricing-tiers.controller';
import { ProjectPricingTiersService } from './project-pricing-tiers.service';

@Module({
  controllers: [ProjectPricingTiersController],
  providers: [ProjectPricingTiersService],
  exports: [ProjectPricingTiersService],
})
export class ProjectPricingTiersModule {}

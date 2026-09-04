import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController, AdminPropertiesController } from './properties.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PropertiesController, AdminPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}

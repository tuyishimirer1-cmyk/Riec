import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectImagesModule } from './project-images/project-images.module';
import { ProjectAssetsModule } from './project-assets/project-assets.module';
import { ProjectPricingTiersModule } from './project-pricing-tiers/project-pricing-tiers.module';
import { ProjectAssignmentsModule } from './project-assignments/project-assignments.module';
import { ProjectPurchasesModule } from './project-purchases/project-purchases.module';
import { PurchasesModule } from './purchases/purchases.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ServicesModule } from './services/services.module';
import { ServiceImagesModule } from './service-images/service-images.module';
import { UsersModule } from './users/users.module';
import { ContactModule } from './contact/contact.module';
import { S3Module } from './s3/s3.module';
import { CareersModule } from './careers/careers.module';
import { ApplicationsModule } from './applications/applications.module';
import { PaymentsModule } from './payments/payments.module';
import { SearchModule } from './search/search.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    ProjectImagesModule,
    ProjectAssetsModule,
    ProjectPricingTiersModule,
    ProjectAssignmentsModule,
    ProjectPurchasesModule,
    PurchasesModule,
    FavoritesModule,
    ServicesModule,
    ServiceImagesModule,
    UsersModule,
    ContactModule,
    S3Module,
    CareersModule,
    ApplicationsModule,
    PaymentsModule,
    SearchModule,
    DashboardModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

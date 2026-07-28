import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TestingModuleBuilder } from '@nestjs/testing';

import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';

import { createTestApp } from './helpers/create-test-app';
import { allowGuard, denyGuard } from './helpers/mock-guards';

describe('DashboardController (e2e)', () => {
  let app: INestApplication<App>;

  const dashboardServiceMock = {
    getOverviewStats: jest.fn(),
    getRevenueStats: jest.fn(),
  };

  const moduleMetadata = {
    controllers: [DashboardController],
    providers: [{ provide: DashboardService, useValue: dashboardServiceMock }],
  };

  const allowDashboardAccess = (builder: TestingModuleBuilder) =>
    builder
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard);

  beforeEach(async () => {
    jest.clearAllMocks();

    app = await createTestApp(moduleMetadata, allowDashboardAccess);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /dashboard/stats returns service payload for default period', async () => {
    dashboardServiceMock.getOverviewStats.mockResolvedValue({
      overview: { projects: 1 },
      period: '30d',
    });

    const response = await request(app.getHttpServer()).get('/dashboard/stats');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      overview: { projects: 1 },
      period: '30d',
    });
    expect(dashboardServiceMock.getOverviewStats).toHaveBeenCalledWith('30d');
  });

  it('GET /dashboard/stats forwards explicit period query', async () => {
    dashboardServiceMock.getOverviewStats.mockResolvedValue({
      overview: { projects: 2 },
      period: '7d',
    });

    const response = await request(app.getHttpServer()).get(
      '/dashboard/stats?period=7d',
    );

    expect(response.status).toBe(200);
    expect(response.body.period).toBe('7d');
    expect(dashboardServiceMock.getOverviewStats).toHaveBeenCalledWith('7d');
  });

  it('GET /dashboard/revenue returns service payload', async () => {
    dashboardServiceMock.getRevenueStats.mockResolvedValue({
      totalRevenue: 500,
      totalPurchases: 4,
      period: '90d',
      byProject: [
        {
          projectId: 'p1',
          projectTitle: 'One',
          revenue: 500,
        },
      ],
    });

    const response = await request(app.getHttpServer()).get(
      '/dashboard/revenue?period=90d',
    );

    expect(response.status).toBe(200);
    expect(response.body.totalRevenue).toBe(500);
    expect(dashboardServiceMock.getRevenueStats).toHaveBeenCalledWith('90d');
  });

  it('returns 403 when auth guard denies access', async () => {
    await app.close();

    const deniedModule = (builder: TestingModuleBuilder) =>
      builder
        .overrideGuard(JwtAuthGuard)
        .useValue(denyGuard)
        .overrideGuard(RolesGuard)
        .useValue(allowGuard);

    app = await createTestApp(moduleMetadata, deniedModule);

    const response = await request(app.getHttpServer()).get('/dashboard/stats');

    expect(response.status).toBe(403);
    expect(dashboardServiceMock.getOverviewStats).not.toHaveBeenCalled();
  });
});

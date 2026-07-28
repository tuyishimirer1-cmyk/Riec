import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TestingModuleBuilder } from '@nestjs/testing';

import { ContactController } from '../src/contact/contact.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/contact/email.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

import { createTestApp } from './helpers/create-test-app';
import { allowGuard, denyGuard } from './helpers/mock-guards';

describe('ContactController (e2e)', () => {
  let app: INestApplication<App>;

  const prismaMock = {
    contactSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const emailServiceMock = {
    sendQuoteEmail: jest.fn(),
  };

  const moduleMetadata = {
    controllers: [ContactController],
    providers: [
      { provide: PrismaService, useValue: prismaMock },
      { provide: EmailService, useValue: emailServiceMock },
    ],
  };

  const allowContactAdminAccess = (builder: TestingModuleBuilder) =>
    builder.overrideGuard(JwtAuthGuard).useValue(allowGuard);

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp(moduleMetadata, allowContactAdminAccess);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /contact creates a submission', async () => {
    prismaMock.contactSubmission.create.mockResolvedValue({
      id: 'sub-1',
      name: 'Grace Hopper',
      email: 'grace@example.com',
      message: 'Need help with architecture',
      read: false,
    });

    const payload = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      message: 'Need help with architecture',
    };

    const response = await request(app.getHttpServer())
      .post('/contact')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 'sub-1',
      email: 'grace@example.com',
      read: false,
    });
    expect(prismaMock.contactSubmission.create).toHaveBeenCalledWith({
      data: payload,
    });
  });

  it('POST /contact/quote sends quote email successfully', async () => {
    emailServiceMock.sendQuoteEmail.mockResolvedValue({ success: true });

    const response = await request(app.getHttpServer())
      .post('/contact/quote')
      .send({
        projectType: 'New build',
        location: 'Kigali',
        budgetRange: '$50k-$100k',
        servicesNeeded: 'Architecture',
        name: 'John Doe',
        email: 'john@example.com',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      message: 'Quote request email sent successfully',
    });
  });

  it('POST /contact/quote returns 500 when email sending fails', async () => {
    emailServiceMock.sendQuoteEmail.mockResolvedValue({
      success: false,
      error: 'Provider down',
    });

    const response = await request(app.getHttpServer())
      .post('/contact/quote')
      .send({
        projectType: 'New build',
        location: 'Kigali',
        budgetRange: '$50k-$100k',
        servicesNeeded: 'Architecture',
        name: 'John Doe',
        email: 'john@example.com',
      });

    expect(response.status).toBe(500);
  });

  it('GET /contact/admin/submissions returns paginated items', async () => {
    const submissions = [{ id: 'c1', name: 'Grace', read: false }];
    prismaMock.$transaction.mockResolvedValue([submissions, 1]);

    const response = await request(app.getHttpServer()).get(
      '/contact/admin/submissions?page=2&pageSize=10',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: submissions,
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it('PATCH /contact/admin/submissions/:id/read marks submission as read', async () => {
    prismaMock.contactSubmission.update.mockResolvedValue({
      id: 'sub-9',
      read: true,
    });

    const response = await request(app.getHttpServer()).patch(
      '/contact/admin/submissions/sub-9/read',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'sub-9', read: true });
    expect(prismaMock.contactSubmission.update).toHaveBeenCalledWith({
      where: { id: 'sub-9' },
      data: { read: true },
    });
  });

  it('GET /contact/admin/submissions returns 403 when auth guard denies', async () => {
    await app.close();

    const denyContactAdminAccess = (builder: TestingModuleBuilder) =>
      builder.overrideGuard(JwtAuthGuard).useValue(denyGuard);

    app = await createTestApp(moduleMetadata, denyContactAdminAccess);

    const response = await request(app.getHttpServer()).get(
      '/contact/admin/submissions',
    );

    expect(response.status).toBe(403);
  });
});

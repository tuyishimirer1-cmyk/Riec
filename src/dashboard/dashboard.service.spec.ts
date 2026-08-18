import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: { count: jest.fn(), findMany: jest.fn() },
    service: { count: jest.fn(), findMany: jest.fn() },
    job: { count: jest.fn(), findMany: jest.fn() },
    jobApplication: { count: jest.fn(), findMany: jest.fn() },
    user: { count: jest.fn() },
    purchase: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    contactSubmission: { count: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverviewStats', () => {
    it('returns aggregate overview stats for a bounded period', async () => {
      mockPrisma.project.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7);
      mockPrisma.service.count.mockResolvedValue(5);
      mockPrisma.job.count.mockResolvedValue(3);
      mockPrisma.jobApplication.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(4);
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.purchase.count.mockResolvedValue(15);
      mockPrisma.contactSubmission.count.mockResolvedValue(2);

      const result = await service.getOverviewStats('30d');

      expect(result).toEqual({
        overview: {
          projects: 10,
          publishedProjects: 7,
          services: 5,
          jobs: 3,
          jobApplications: 20,
          pendingApplications: 4,
          users: 50,
          purchases: 15,
          unreadSubmissions: 2,
        },
        period: '30d',
      });

      expect(mockPrisma.project.count).toHaveBeenNthCalledWith(1, {
        where: {
          createdAt: { gte: expect.any(Date) },
        },
      });
      expect(mockPrisma.project.count).toHaveBeenNthCalledWith(2, {
        where: {
          createdAt: { gte: expect.any(Date) },
          isPublished: true,
        },
      });
      expect(mockPrisma.jobApplication.count).toHaveBeenNthCalledWith(2, {
        where: { status: 'NEW' },
      });
    });

    it('does not apply createdAt filter for unknown periods', async () => {
      mockPrisma.project.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(2);
      mockPrisma.service.count.mockResolvedValue(1);
      mockPrisma.job.count.mockResolvedValue(1);
      mockPrisma.jobApplication.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.purchase.count.mockResolvedValue(1);
      mockPrisma.contactSubmission.count.mockResolvedValue(0);

      await service.getOverviewStats('all');

      expect(mockPrisma.project.count).toHaveBeenNthCalledWith(1, {
        where: {},
      });
      expect(mockPrisma.job.count).toHaveBeenCalledWith({ where: {} });
      expect(mockPrisma.purchase.count).toHaveBeenCalledWith({ where: {} });
    });
  });

  describe('getRevenueStats', () => {
    it('returns revenue totals and project labels for grouped purchases', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([
        { amount: 100, projectId: 'p1', project: { title: 'Project One' } },
        { amount: 50, projectId: 'p2', project: { title: 'Project Two' } },
      ]);
      mockPrisma.purchase.groupBy.mockResolvedValue([
        { projectId: 'p1', _sum: { amount: 100 } },
        { projectId: 'p2', _sum: { amount: 50 } },
      ]);
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', title: 'Project One' },
        { id: 'p2', title: 'Project Two' },
      ]);

      const result = await service.getRevenueStats('90d');

      expect(result).toEqual({
        totalRevenue: 150,
        totalPurchases: 2,
        period: '90d',
        byProject: [
          { projectId: 'p1', projectTitle: 'Project One', revenue: 100 },
          { projectId: 'p2', projectTitle: 'Project Two', revenue: 50 },
        ],
      });

      expect(mockPrisma.purchase.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: { gte: expect.any(Date) },
        },
        include: { project: { select: { title: true } } },
      });
    });

    it('handles missing project title mapping gracefully', async () => {
      mockPrisma.purchase.findMany.mockResolvedValue([
        { amount: 42, projectId: 'unknown', project: { title: 'Unknown' } },
      ]);
      mockPrisma.purchase.groupBy.mockResolvedValue([
        { projectId: 'unknown', _sum: { amount: 42 } },
      ]);
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await service.getRevenueStats('all');

      expect(result.byProject).toEqual([
        { projectId: 'unknown', projectTitle: 'Unknown', revenue: 42 },
      ]);
      expect(mockPrisma.purchase.groupBy).toHaveBeenCalledWith({
        by: ['projectId'],
        where: {},
        _sum: { amount: true },
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { EmailService } from '../contact/email.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    projectImage: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    projectAsset: { create: jest.fn(), delete: jest.fn() },
    projectPricingTier: { create: jest.fn(), delete: jest.fn() },
    projectAssignment: { create: jest.fn(), delete: jest.fn() },
    service: { findUnique: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    deleteFiles: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
        { provide: EmailService, useValue: { sendProjectEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create project with slug generation', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue({ id: '1', slug: 'test-project' });

      const result = await service.create({ title: 'Test Project' } as any);

      expect(result.slug).toBe('test-project');
    });
  });

  describe('list', () => {
    it('should return paginated results', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const result = await service.list({}, 1, 20);

      expect(result.data).toBeDefined();
    });

    it('should handle featured filter', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await service.list({ featured: true }, 1, 20);
    });

    it('should handle type filter', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await service.list({ type: 'COMPLETED' }, 1, 20);
    });

    it('should handle category filter', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await service.list({ category: 'RESIDENTIAL' }, 1, 20);
    });
  });

  describe('findByIdentifier', () => {
    it('should find by ID', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });

      const result = await service.findByIdentifier('507f1f77bcf86cd799439011');

      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should find by slug', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ slug: 'test-project' });

      const result = await service.findByIdentifier('test-project');

      expect(result.slug).toBe('test-project');
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.project.update.mockResolvedValue({ id: '1' });

      const result = await service.update('1', { title: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.project.delete.mockResolvedValue({ id: '1' });
      mockPrisma.projectImage.findMany.mockResolvedValue([]);

      await service.remove('1');

      expect(mockPrisma.project.delete).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '1', isPublished: false });
      mockPrisma.project.update.mockResolvedValue({ id: '1', isPublished: true });

      const result = await service.publish('1');

      expect(result.isPublished).toBe(true);
    });
  });

  describe('unpublish', () => {
    it('should unpublish project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '1', isPublished: true });
      mockPrisma.project.update.mockResolvedValue({ id: '1', isPublished: false });

      const result = await service.unpublish('1');

      expect(result.isPublished).toBe(false);
    });
  });

  describe('getCategories', () => {
    it('should return categories', () => {
      const result = service.getCategories();

      expect(result).toBeDefined();
    });
  });

  describe('getProjectsByCategory', () => {
    it('should return projects', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      const result = await service.getProjectsByCategory('RESIDENTIAL', 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('getProjectCountByCategory', () => {
    it('should return count', async () => {
      mockPrisma.project.count.mockResolvedValue(10);

      const result = await service.getProjectCountByCategory('RESIDENTIAL');

      expect(result.count).toBe(10);
    });
  });

  describe('getCategoriesSummary', () => {
    it('should return summary', async () => {
      mockPrisma.project.groupBy.mockResolvedValue([]);

      const result = await service.getCategoriesSummary();

      expect(result).toBeDefined();
    });
  });

  describe('addYoutubeVideo', () => {
    it('should add youtube video', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '1', type: 'COMPLETED' });
      mockPrisma.project.update.mockResolvedValue({ id: '1', youtubeVideoUrl: 'https://youtube.com' });

      const result = await service.addYoutubeVideo('1', 'https://youtube.com');

      expect(result.youtubeVideoUrl).toBe('https://youtube.com');
    });

    it('should throw for non-completed project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: '1', type: 'PLAN_TO_BUY' });

      await expect(service.addYoutubeVideo('1', 'https://youtube.com')).rejects.toThrow();
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: { findMany: jest.fn(), count: jest.fn() },
    service: { findMany: jest.fn(), count: jest.fn() },
    job: { findMany: jest.fn(), count: jest.fn() },
    jobApplication: { findMany: jest.fn(), count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('globalSearch', () => {
    it('should return global search results', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.job.findMany.mockResolvedValue([]);
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      const result = await service.globalSearch('test', undefined, 1, 20);

      expect(result).toBeDefined();
    });

    it('should filter by type', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await service.globalSearch('test', 'projects', 1, 20);

      expect(mockPrisma.project.findMany).toHaveBeenCalled();
    });
  });

  describe('searchProjects', () => {
    it('should return project search', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const result = await service.searchProjects('villa', {}, 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('searchServices', () => {
    it('should return service search', async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);

      const result = await service.searchServices('architectural', 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('searchJobs', () => {
    it('should return job search', async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.searchJobs('engineer', {}, 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('searchApplications', () => {
    it('should return application search', async () => {
      mockPrisma.jobApplication.findMany.mockResolvedValue([]);

      const result = await service.searchApplications('john', {}, 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('searchSuggestions', () => {
    it('should return suggestions', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.searchSuggestions('arch', 5);

      expect(result).toBeDefined();
    });
  });
});
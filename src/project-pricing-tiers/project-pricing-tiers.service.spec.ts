import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPricingTiersService } from './project-pricing-tiers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectPricingTiersService', () => {
  let service: ProjectPricingTiersService;
  let prisma: PrismaService;

  const mockPrisma = {
    projectPriceTier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectPricingTiersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectPricingTiersService>(ProjectPricingTiersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create pricing tier', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectPriceTier.create.mockResolvedValue({ id: '1' });

      const result = await service.create('proj1', { name: 'Basic' });

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return tiers', async () => {
      mockPrisma.projectPriceTier.findMany.mockResolvedValue([]);

      const result = await service.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return tier', async () => {
      mockPrisma.projectPriceTier.findFirst.mockResolvedValue({ id: 'tier1' });

      const result = await service.findOne('proj1', 'tier1');

      expect(result.id).toBe('tier1');
    });
  });

  describe('update', () => {
    it('should update tier', async () => {
      mockPrisma.projectPriceTier.findFirst.mockResolvedValue({ id: 'tier1' });
      mockPrisma.projectPriceTier.update.mockResolvedValue({ id: '1' });

      const result = await service.update('proj1', 'tier1', { name: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove tier', async () => {
      mockPrisma.projectPriceTier.findFirst.mockResolvedValue({ id: 'tier1' });
      mockPrisma.projectPriceTier.delete.mockResolvedValue({ id: 'tier1' });

      await service.remove('proj1', 'tier1');

      expect(mockPrisma.projectPriceTier.delete).toHaveBeenCalled();
    });
  });
});
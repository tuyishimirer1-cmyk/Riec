import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPurchasesService } from './project-purchases.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

describe('ProjectPurchasesService', () => {
  let service: ProjectPurchasesService;
  let prisma: PrismaService;

  const mockPrisma = {
    projectPurchase: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    projectPriceTier: {
      findFirst: jest.fn(),
    },
    purchase: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockS3Service = {
    generatePrivateSignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectPurchasesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProjectPurchasesService>(ProjectPurchasesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return purchases', async () => {
      mockPrisma.projectPurchase.findMany.mockResolvedValue([]);

      const result = await service.list('proj1', 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return purchase', async () => {
      mockPrisma.purchase.findFirst.mockResolvedValue({ id: '1' });

      const result = await service.findOne('proj1', 'purchase1');

      expect(result.id).toBe('1');
    });
  });

  describe('getMyPurchases', () => {
    it('should return user purchases', async () => {
      mockPrisma.projectPurchase.findMany.mockResolvedValue([]);

      const result = await service.getMyPurchases('user@example.com', 1, 20);

      expect(result).toBeDefined();
    });
  });
});
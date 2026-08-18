import { Test, TestingModule } from '@nestjs/testing';
import { CareersService } from './careers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CareersService', () => {
  let service: CareersService;
  let prisma: PrismaService;

  const mockPrisma = {
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    jobApplication: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([[], 0]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CareersService>(CareersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a job', async () => {
      mockPrisma.job.create.mockResolvedValue({ id: '1' });

      const result = await service.create({ title: 'Developer' });

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return jobs', async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.list({}, 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('findByIdentifier', () => {
    it('should return job', async () => {
      mockPrisma.job.findFirst.mockResolvedValue({ id: '1' });

      const result = await service.findByIdentifier('1');

      expect(result.id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update job', async () => {
      mockPrisma.job.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.job.update.mockResolvedValue({ id: '1' });

      const result = await service.update('1', { title: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove job', async () => {
      mockPrisma.job.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.job.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(mockPrisma.job.delete).toHaveBeenCalled();
    });
  });
});

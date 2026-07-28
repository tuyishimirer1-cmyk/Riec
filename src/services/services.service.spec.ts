import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: PrismaService;

  const mockPrisma = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: { uploadFile: jest.fn() } },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a service', async () => {
      mockPrisma.service.create.mockResolvedValue({ id: '1' });

      const result = await service.create({ name: 'Test' });

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return services list', async () => {
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.service.count.mockResolvedValue(0);

      const result = await service.list(1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('findByIdentifier', () => {
    it('should find by ID', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });

      const result = await service.findByIdentifier('507f1f77bcf86cd799439011');

      expect(result.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should find by slug', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: '1' });

      const result = await service.findByIdentifier('test-service');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      mockPrisma.service.update.mockResolvedValue({ id: '1' });

      const result = await service.update('1', { name: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockPrisma.service.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');

      expect(mockPrisma.service.delete).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish a service', async () => {
      mockPrisma.service.update.mockResolvedValue({ published: true });

      const result = await service.publish('1');

      expect(result.published).toBe(true);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a service', async () => {
      mockPrisma.service.update.mockResolvedValue({ published: false });

      const result = await service.unpublish('1');

      expect(result.published).toBe(false);
    });
  });
});
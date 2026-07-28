import { Test, TestingModule } from '@nestjs/testing';
import { ServiceImagesService } from './service-images.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

describe('ServiceImagesService', () => {
  let service: ServiceImagesService;
  let prisma: PrismaService;
  let s3Service: S3Service;

  const mockPrisma = {
    serviceImage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    deleteFileByKey: jest.fn(),
    generateSignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceImagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ServiceImagesService>(ServiceImagesService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload images', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.serviceImage.count.mockResolvedValue(0);
      mockS3Service.uploadFile.mockResolvedValue('key');
      mockPrisma.serviceImage.create.mockResolvedValue({ id: '1' });

      const result = await service.upload('proj1', [], []);

      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return images', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.serviceImage.findMany.mockResolvedValue([]);

      const result = await service.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update image', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.serviceImage.findFirst.mockResolvedValue({ id: 'img1' });
      mockPrisma.serviceImage.update.mockResolvedValue({ id: '1' });

      const result = await service.update('proj1', 'img1', { caption: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove image', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.serviceImage.findFirst.mockResolvedValue({ id: 'img1', s3Key: 'key' });
      mockPrisma.serviceImage.delete.mockResolvedValue({ id: 'img1' });

      await service.remove('proj1', 'img1');

      expect(mockPrisma.serviceImage.delete).toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('should reorder images', async () => {
      mockPrisma.service.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.serviceImage.updateMany.mockResolvedValue({});
      mockPrisma.serviceImage.findMany.mockResolvedValue([]);

      const result = await service.reorder('proj1', ['img1']);

      expect(result).toBeDefined();
    });
  });
});
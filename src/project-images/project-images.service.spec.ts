import { Test, TestingModule } from '@nestjs/testing';
import { ProjectImagesService } from './project-images.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

describe('ProjectImagesService', () => {
  let service: ProjectImagesService;
  let prisma: PrismaService;
  let s3Service: S3Service;

  const mockPrisma = {
    projectImage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    deleteFileByKey: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectImagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProjectImagesService>(ProjectImagesService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload images', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectImage.count.mockResolvedValue(0);
      mockS3Service.uploadFile.mockResolvedValue('key');
      mockPrisma.projectImage.create.mockResolvedValue({ id: '1' });

      const result = await service.upload('proj1', [], []);

      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return images', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectImage.findMany.mockResolvedValue([]);

      const result = await service.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update image', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectImage.findFirst.mockResolvedValue({ id: 'img1' });
      mockPrisma.projectImage.update.mockResolvedValue({ id: '1' });

      const result = await service.update('proj1', 'img1', {
        caption: 'Updated',
      });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove image', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectImage.findFirst.mockResolvedValue({
        id: 'img1',
        s3Key: 'key',
      });
      mockPrisma.projectImage.delete.mockResolvedValue({ id: 'img1' });

      await service.remove('proj1', 'img1');

      expect(mockPrisma.projectImage.delete).toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('should reorder images', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectImage.updateMany.mockResolvedValue({});
      mockPrisma.projectImage.findMany.mockResolvedValue([]);

      const result = await service.reorder('proj1', ['img1']);

      expect(result).toBeDefined();
    });
  });
});

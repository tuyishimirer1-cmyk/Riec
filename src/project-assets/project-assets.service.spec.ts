import { Test, TestingModule } from '@nestjs/testing';
import { ProjectAssetsService } from './project-assets.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

describe('ProjectAssetsService', () => {
  let service: ProjectAssetsService;
  let prisma: PrismaService;
  let s3Service: S3Service;

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    projectAsset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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
        ProjectAssetsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<ProjectAssetsService>(ProjectAssetsService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload asset', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockS3Service.uploadFile.mockResolvedValue('key');
      mockPrisma.projectAsset.create.mockResolvedValue({ id: '1' });

      const result = await service.upload('proj1', [], []);

      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return assets', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectAsset.findMany.mockResolvedValue([]);
      mockPrisma.projectAsset.count.mockResolvedValue(0);

      const result = await service.list('proj1', {}, 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove asset', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectAsset.findFirst.mockResolvedValue({ id: 'asset1', s3Key: 'key' });
      mockPrisma.projectAsset.delete.mockResolvedValue({ id: 'asset1' });

      await service.remove('proj1', 'asset1');

      expect(mockPrisma.projectAsset.delete).toHaveBeenCalled();
    });
  });
});
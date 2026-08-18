import { Test, TestingModule } from '@nestjs/testing';
import { ProjectAssetsController } from './project-assets.controller';
import { ProjectAssetsService } from './project-assets.service';

describe('ProjectAssetsController', () => {
  let controller: ProjectAssetsController;
  let service: ProjectAssetsService;

  const mockService = {
    upload: jest.fn(),
    list: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectAssetsController],
      providers: [
        {
          provide: ProjectAssetsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectAssetsController>(ProjectAssetsController);
    service = module.get<ProjectAssetsService>(ProjectAssetsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should upload asset', async () => {
      mockService.upload.mockResolvedValue({ id: '1' });

      const mockReq = { user: { userId: 'user1' } };
      const result = await controller.upload('proj1', [], {}, mockReq as any);

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return assets', async () => {
      mockService.list.mockResolvedValue([]);

      const result = await controller.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove asset', async () => {
      await controller.remove('proj1', 'asset1');

      expect(mockService.remove).toHaveBeenCalledWith('proj1', 'asset1');
    });
  });
});

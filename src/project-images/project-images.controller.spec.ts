import { Test, TestingModule } from '@nestjs/testing';
import { ProjectImagesController } from './project-images.controller';
import { ProjectImagesService } from './project-images.service';

describe('ProjectImagesController', () => {
  let controller: ProjectImagesController;
  let service: ProjectImagesService;

  const mockService = {
    upload: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectImagesController],
      providers: [
        {
          provide: ProjectImagesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectImagesController>(ProjectImagesController);
    service = module.get<ProjectImagesService>(ProjectImagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should upload images', async () => {
      mockService.upload.mockResolvedValue([]);

      const result = await controller.upload('proj1', [], []);

      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return images', async () => {
      mockService.list.mockResolvedValue([]);

      const result = await controller.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an image', async () => {
      mockService.update.mockResolvedValue({ caption: 'Updated' });

      const result = await controller.update('proj1', 'img1', { caption: 'Updated' });

      expect(result.caption).toBe('Updated');
    });
  });

  describe('reorder', () => {
    it('should reorder images', async () => {
      mockService.reorder.mockResolvedValue([]);

      const result = await controller.reorder('proj1', { ids: ['img1'] });

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should delete an image', async () => {
      await controller.remove('proj1', 'img1');

      expect(mockService.remove).toHaveBeenCalledWith('proj1', 'img1');
    });
  });
});
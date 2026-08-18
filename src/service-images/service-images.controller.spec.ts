import { Test, TestingModule } from '@nestjs/testing';
import { ServiceImagesController } from './service-images.controller';
import { ServiceImagesService } from './service-images.service';

describe('ServiceImagesController', () => {
  let controller: ServiceImagesController;
  let service: ServiceImagesService;

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
      controllers: [ServiceImagesController],
      providers: [
        {
          provide: ServiceImagesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ServiceImagesController>(ServiceImagesController);
    service = module.get<ServiceImagesService>(ServiceImagesService);
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

      const result = await controller.update('proj1', 'img1', {
        caption: 'Updated',
      });

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

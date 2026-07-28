import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

  const mockService = {
    create: jest.fn(),
    list: jest.fn(),
    findByIdentifier: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a service', async () => {
      mockService.create.mockResolvedValue({ id: '1' });

      const result = await controller.create({ name: 'Test' } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return services list', async () => {
      mockService.list.mockResolvedValue({ data: [], total: 0, meta: {} });

      const result = await controller.list(1, 20);

      expect(result).toBeDefined();
    });

    it('should pass include param', async () => {
      mockService.list.mockResolvedValue({ data: [], total: 0, meta: {} });

      await controller.list(1, 20, 'images,projects');

      expect(mockService.list).toHaveBeenCalledWith(1, 20, 'images,projects');
    });
  });

  describe('findByIdentifier', () => {
    it('should return service by identifier', async () => {
      mockService.findByIdentifier.mockResolvedValue({ id: '1' });

      const result = await controller.findByIdentifier('test-slug');

      expect(result.id).toBe('1');
    });

    it('should pass include param', async () => {
      mockService.findByIdentifier.mockResolvedValue({ id: '1' });

      await controller.findByIdentifier('test-slug', 'images,projects');

      expect(mockService.findByIdentifier).toHaveBeenCalledWith('test-slug', 'images,projects');
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      mockService.update.mockResolvedValue({ id: '1' });

      const result = await controller.update('1', { name: 'Updated' } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      mockService.remove.mockResolvedValue({ message: 'deleted' });

      const result = await controller.remove('1');

      expect(result.message).toBe('deleted');
    });
  });

  describe('publish', () => {
    it('should publish a service', async () => {
      mockService.publish.mockResolvedValue({ published: true });

      const result = await controller.publish('1');

      expect(result.published).toBe(true);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a service', async () => {
      mockService.unpublish.mockResolvedValue({ published: false });

      const result = await controller.unpublish('1');

      expect(result.published).toBe(false);
    });
  });
});
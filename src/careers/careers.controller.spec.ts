import { Test, TestingModule } from '@nestjs/testing';
import { CareersController } from './careers.controller';
import { CareersService } from './careers.service';

describe('CareersController', () => {
  let controller: CareersController;
  let service: CareersService;

  const mockService = {
    create: jest.fn(),
    list: jest.fn(),
    findByIdentifier: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getApplications: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CareersController],
      providers: [
        {
          provide: CareersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CareersController>(CareersController);
    service = module.get<CareersService>(CareersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a job', async () => {
      mockService.create.mockResolvedValue({ id: '1' });

      const result = await controller.create({ title: 'Developer' } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return jobs', async () => {
      mockService.list.mockResolvedValue({ data: [], total: 0, meta: {} });

      const result = await controller.list(1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('findByIdentifier', () => {
    it('should return job', async () => {
      mockService.findByIdentifier.mockResolvedValue({ id: '1' });

      const result = await controller.findByIdentifier('1');

      expect(result.id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update job', async () => {
      mockService.update.mockResolvedValue({ id: '1' });

      const result = await controller.update('1', { title: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove job', async () => {
      await controller.remove('1');

      expect(mockService.remove).toHaveBeenCalledWith('1');
    });
  });
});

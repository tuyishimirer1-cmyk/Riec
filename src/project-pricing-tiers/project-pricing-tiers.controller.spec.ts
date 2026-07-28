import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPricingTiersController } from './project-pricing-tiers.controller';
import { ProjectPricingTiersService } from './project-pricing-tiers.service';

describe('ProjectPricingTiersController', () => {
  let controller: ProjectPricingTiersController;
  let service: ProjectPricingTiersService;

  const mockService = {
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectPricingTiersController],
      providers: [
        {
          provide: ProjectPricingTiersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectPricingTiersController>(ProjectPricingTiersController);
    service = module.get<ProjectPricingTiersService>(ProjectPricingTiersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create pricing tier', async () => {
      mockService.create.mockResolvedValue({ id: '1' });

      const result = await controller.create('proj1', { name: 'Basic' } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return pricing tiers', async () => {
      mockService.list.mockResolvedValue([]);

      const result = await controller.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update pricing tier', async () => {
      mockService.update.mockResolvedValue({ id: '1' });

      const result = await controller.update('proj1', 'tier1', { name: 'Updated' });

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should remove pricing tier', async () => {
      await controller.remove('proj1', 'tier1');

      expect(mockService.remove).toHaveBeenCalledWith('proj1', 'tier1');
    });
  });
});
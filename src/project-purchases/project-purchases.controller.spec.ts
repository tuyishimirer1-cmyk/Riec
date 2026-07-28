import { Test, TestingModule } from '@nestjs/testing';
import { ProjectPurchasesController } from './project-purchases.controller';
import { ProjectPurchasesService } from './project-purchases.service';

describe('ProjectPurchasesController', () => {
  let controller: ProjectPurchasesController;
  let service: ProjectPurchasesService;

  const mockService = {
    list: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectPurchasesController],
      providers: [
        {
          provide: ProjectPurchasesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectPurchasesController>(ProjectPurchasesController);
    service = module.get<ProjectPurchasesService>(ProjectPurchasesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return purchases list', async () => {
      mockService.list.mockResolvedValue({ data: [], total: 0, meta: {} });

      const result = await controller.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return purchase details', async () => {
      mockService.findOne.mockResolvedValue({ id: '1' });

      const result = await controller.findOne('proj1', 'purchase1');

      expect(result.id).toBe('1');
    });
  });
});
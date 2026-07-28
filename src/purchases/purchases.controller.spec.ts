import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { ProjectPurchasesService } from '../project-purchases/project-purchases.service';

describe('PurchasesController', () => {
  let controller: PurchasesController;
  let service: ProjectPurchasesService;

  const mockService = {
    getMyPurchases: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        {
          provide: ProjectPurchasesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
    service = module.get<ProjectPurchasesService>(ProjectPurchasesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyPurchases', () => {
    it('should return user purchases', async () => {
      mockService.getMyPurchases.mockResolvedValue({
        data: [],
        total: 0,
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await controller.getMyPurchases(
        { user: { email: 'test@example.com' } } as any,
      );

      expect(result).toBeDefined();
    });
  });
});
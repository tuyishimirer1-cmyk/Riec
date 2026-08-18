import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockService = {
    getOverviewStats: jest.fn(),
    getRevenueStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return overview stats', async () => {
      mockService.getOverviewStats.mockResolvedValue({ overview: {} });

      const result = await controller.getDashboardStats();

      expect(result).toBeDefined();
    });

    it('should use default period 30d', async () => {
      mockService.getOverviewStats.mockResolvedValue({ overview: {} });

      await controller.getDashboardStats();

      expect(mockService.getOverviewStats).toHaveBeenCalledWith('30d');
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue stats', async () => {
      mockService.getRevenueStats.mockResolvedValue({ totalRevenue: 0 });

      const result = await controller.getRevenueStats();

      expect(result).toBeDefined();
    });
  });
});

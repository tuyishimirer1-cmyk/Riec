import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockService = {
    initProjectCheckout: jest.fn(),
    handleWebhook: jest.fn(),
    getDownloadsByToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initProjectCheckout', () => {
    it('should create checkout session', async () => {
      mockService.initProjectCheckout.mockResolvedValue({ paymentLink: 'https://checkout' });

      const result = await controller.initProjectCheckout({ projectId: '1', tierId: '1', email: 'test@test.com', fullName: 'Test' });

      expect(result.paymentLink).toBe('https://checkout');
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook', async () => {
      mockService.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook({ data: {} });

      expect(result.received).toBe(true);
    });
  });

  describe('getDownloads', () => {
    it('should get downloads by token', async () => {
      mockService.getDownloadsByToken.mockResolvedValue({ assets: [] });

      const result = await controller.getDownloads('token123');

      expect(result).toBeDefined();
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initProjectCheckout', () => {
    it('should create checkout session', async () => {
      mockService.initProjectCheckout.mockResolvedValue({
        link: 'https://checkout.rwandapay.rw/xyz',
        ref: 'RIEC-123-456',
      });

      const result = await controller.initProjectCheckout({
        projectId: '1',
        tierId: '1',
        email: 'test@test.com',
        fullName: 'Test',
      });

      expect(result.link).toBe('https://checkout.rwandapay.rw/xyz');
      expect(result.ref).toBe('RIEC-123-456');
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook', async () => {
      mockService.handleWebhook.mockResolvedValue({ 
        message: 'Webhook processed successfully' 
      });

      const result = await controller.handleWebhook({ 
        ref: 'RIEC-123-456',
        status: 'successful',
        merchant_ref: 'purchase123'
      });

      expect(result.message).toBe('Webhook processed successfully');
    });
  });

  describe('getDownloads', () => {
    it('should get downloads by token', async () => {
      mockService.getDownloadsByToken.mockResolvedValue([
        { id: '1', filename: 'plan.pdf', documentType: 'ARCHITECTURAL_DRAWINGS' }
      ]);

      const result = await controller.getDownloads('token123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

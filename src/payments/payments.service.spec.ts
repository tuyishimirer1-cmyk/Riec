import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    purchase: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('sk_test_123'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    (axios.post as jest.Mock).mockResolvedValue({
      data: { data: { link: 'http://test.link' } },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initProjectCheckout', () => {
    it('should create session', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj1',
        purchasable: true,
        pricingTiers: [
          { id: 'tier1', amount: 100, currency: 'USD', isActive: true },
        ],
      });
      mockPrisma.purchase.create.mockResolvedValue({ id: '1' });
      mockPrisma.purchase.update.mockResolvedValue({ id: '1' });

      const result = await service.initProjectCheckout({
        projectId: 'proj1',
        tierId: 'tier1',
        email: 'user@example.com',
        fullName: 'Test User',
      });

      expect(result).toBeDefined();
    });
  });

  describe('handleWebhook', () => {
    it('should handle successful payment', async () => {
      mockPrisma.purchase.findFirst.mockResolvedValue({
        id: '1',
        status: 'PENDING',
      });
      mockPrisma.purchase.update.mockResolvedValue({
        id: '1',
        status: 'SUCCESS',
      });

      await service.handleWebhook({
        data: { tx_ref: 'test-ref', status: 'successful' },
      });

      expect(mockPrisma.purchase.update).toHaveBeenCalled();
    });
  });
});

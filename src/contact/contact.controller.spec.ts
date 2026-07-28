import { Test, TestingModule } from '@nestjs/testing';
import { ContactController } from './contact.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

describe('ContactController', () => {
  let controller: ContactController;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockPrisma = {
    contactSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockEmailService = {
    sendContactEmail: jest.fn(),
    sendQuoteEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    controller = module.get<ContactController>(ContactController);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a contact submission', async () => {
      mockPrisma.contactSubmission.create.mockResolvedValue({ id: '1' });

      const result = await controller.create({
        name: 'Test',
        email: 'test@example.com',
        message: 'Hello',
      } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('sendQuoteEmail', () => {
    it('should send quote email', async () => {
      mockEmailService.sendQuoteEmail.mockResolvedValue({ success: true });

      const result = await controller.sendQuoteEmail({
        projectType: 'New',
        location: 'Nairobi',
        budgetRange: '$100k',
        servicesNeeded: 'Architecture',
        name: 'John',
        email: 'john@example.com',
      } as any);

      expect(result.success).toBe(true);
    });

    it('should throw error if email fails', async () => {
      mockEmailService.sendQuoteEmail.mockResolvedValue({ success: false, error: 'Failed' });

      await expect(
        controller.sendQuoteEmail({
          projectType: 'New',
          location: 'Nairobi',
          budgetRange: '$100k',
          servicesNeeded: 'Architecture',
          name: 'John',
          email: 'john@example.com',
        } as any),
      ).rejects.toThrow('Failed');
    });
  });

  describe('list', () => {
    it('should return paginated submissions', async () => {
      mockPrisma.contactSubmission.findMany.mockResolvedValue([]);
      mockPrisma.contactSubmission.count.mockResolvedValue(0);

      const result = await controller.list();

      expect(result).toBeDefined();
    });
  });

  describe('markRead', () => {
    it('should mark submission as read', async () => {
      mockPrisma.contactSubmission.update.mockResolvedValue({ id: '1', read: true });

      const result = await controller.markRead('1');

      expect(result.read).toBe(true);
    });
  });
});
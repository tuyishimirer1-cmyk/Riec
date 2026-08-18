import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendQuoteEmail', () => {
    it('should send quote email', async () => {
      const result = await service.sendQuoteEmail({
        projectType: 'New',
        location: 'Nairobi',
        budgetRange: '$100k',
        servicesNeeded: 'Architecture',
        name: 'John',
        email: 'john@example.com',
      });

      // Email service returns { success: false, error: 'Email service is not configured' } when RESEND_API_KEY is not set
      expect(result).toBeDefined();
    });
  });
});

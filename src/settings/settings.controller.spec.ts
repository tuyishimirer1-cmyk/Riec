import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getSocialLinks: jest.fn(),
    updateSocialLinks: jest.fn(),
    getSiteInfo: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return settings', () => {
      mockService.getSettings.mockReturnValue({
        statusCode: 200,
        data: { siteName: 'RIEC' },
      });

      const result = controller.getSettings();

      expect(result.statusCode).toBe(200);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      mockService.updateSettings.mockReturnValue({
        statusCode: 200,
        data: { siteName: 'Updated' },
      });

      const result = controller.updateSettings({ siteName: 'Updated' });

      expect(result.statusCode).toBe(200);
    });
  });

  describe('getSocialLinks', () => {
    it('should return social links', () => {
      mockService.getSocialLinks.mockReturnValue({
        statusCode: 200,
        data: { facebook: 'https://fb.com' },
      });

      const result = controller.getSocialLinks();

      expect(result.statusCode).toBe(200);
    });
  });

  describe('updateSocialLinks', () => {
    it('should update social links', () => {
      mockService.updateSocialLinks.mockReturnValue({
        statusCode: 200,
        data: { facebook: 'https://fb.com' },
      });

      const result = controller.updateSocialLinks({ facebook: 'https://fb.com' });

      expect(result.statusCode).toBe(200);
    });
  });

  describe('getSiteInfo', () => {
    it('should return site info', () => {
      mockService.getSiteInfo.mockReturnValue({
        statusCode: 200,
        data: { name: 'RIEC', url: 'https://riec.com' },
      });

      const result = controller.getSiteInfo();

      expect(result.statusCode).toBe(200);
    });
  });
});
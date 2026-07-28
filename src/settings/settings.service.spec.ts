import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return settings', async () => {
      const result = await service.getSettings();

      expect(result.data.siteName).toBe('RIEC');
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const result = await service.updateSettings({ siteName: 'Updated' });

      expect(result.data.siteName).toBe('Updated');
    });
  });

  describe('getSocialLinks', () => {
    it('should return social links', async () => {
      const result = await service.getSocialLinks();

      expect(result).toBeDefined();
    });
  });

  describe('updateSocialLinks', () => {
    it('should update social links', async () => {
      const result = await service.updateSocialLinks({ facebook: 'https://fb.com' });

      expect(result.data.facebook).toBe('https://fb.com');
    });
  });

  describe('getSiteInfo', () => {
    it('should return site info', async () => {
      const result = await service.getSiteInfo();

      expect(result.data.name).toBe('RIEC');
    });
  });
});
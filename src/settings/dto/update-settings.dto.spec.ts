import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSettingsDto } from './update-settings.dto';

describe('UpdateSettingsDto', () => {
  it('should be defined', () => {
    const dto = new UpdateSettingsDto();
    expect(dto).toBeDefined();
  });

  it('should accept partial data', () => {
    const dto: Partial<UpdateSettingsDto> = {
      siteName: 'Test Site',
    };
    expect(dto.siteName).toBe('Test Site');
  });
});
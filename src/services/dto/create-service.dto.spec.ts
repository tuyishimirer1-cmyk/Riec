import { Test, TestingModule } from '@nestjs/testing';
import { CreateServiceDto } from './create-service.dto';

describe('CreateServiceDto', () => {
  it('should be defined', () => {
    const dto = new CreateServiceDto();
    expect(dto).toBeDefined();
  });

  it('should accept data', () => {
    const dto: Partial<CreateServiceDto> = {
      name: 'Test Service',
      slug: 'test-service',
    };
    expect(dto.name).toBe('Test Service');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateServiceImageDto } from './update-service-image.dto';

describe('UpdateServiceImageDto', () => {
  it('should be defined', () => {
    const dto = new UpdateServiceImageDto();
    expect(dto).toBeDefined();
  });
});
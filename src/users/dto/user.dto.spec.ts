import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserProfileDto } from './update-user-profile.dto';
import { UpdateUserRoleDto } from './update-user-role.dto';

describe('User DTOs', () => {
  describe('UpdateUserProfileDto', () => {
    it('should be defined', () => {
      const dto = new UpdateUserProfileDto();
      expect(dto).toBeDefined();
    });
  });

  describe('UpdateUserRoleDto', () => {
    it('should be defined', () => {
      const dto = new UpdateUserRoleDto();
      expect(dto).toBeDefined();
    });
  });
});
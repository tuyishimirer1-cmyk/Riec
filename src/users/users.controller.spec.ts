import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../contact/email.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockService = {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
    getUserStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockService.getUserProfile.mockResolvedValue({ id: '1' });

      const result = await controller.getProfile({
        user: { userId: '1' },
      } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      mockService.updateUserProfile.mockResolvedValue({ id: '1' });

      const result = await controller.updateProfile(
        { user: { userId: '1' } } as any,
        { profileImg: 'new.jpg' },
      );

      expect(result.id).toBe('1');
    });
  });

  describe('getUsers', () => {
    it('should return users list', async () => {
      mockService.getUsers.mockResolvedValue({ data: [], total: 0, meta: {} });

      const result = await controller.getUsers(1, 20);

      expect(result).toBeDefined();
    });

    it('should filter by role', async () => {
      mockService.getUsers.mockResolvedValue({ data: [], total: 0, meta: {} });

      await controller.getUsers(1, 20, 'ADMIN');

      expect(mockService.getUsers).toHaveBeenCalledWith(1, 20, 'ADMIN');
    });
  });

  describe('getUser', () => {
    it('should return user by ID', async () => {
      mockService.getUserById.mockResolvedValue({ id: '1' });

      const result = await controller.getUser('1');

      expect(result.id).toBe('1');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      mockService.updateUserRole.mockResolvedValue({ id: '1', role: 'ADMIN' });

      const result = await controller.updateUserRole('1', { role: 'ADMIN' }, {
        user: { userId: 'admin' },
      } as any);

      expect(result.role).toBe('ADMIN');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      await controller.deleteUser('1', { user: { userId: 'admin' } } as any);

      expect(mockService.deleteUser).toHaveBeenCalledWith('1', 'admin');
    });
  });

  describe('getUserStats', () => {
    it('should return user stats', async () => {
      mockService.getUserStats.mockResolvedValue({ total: 100 });

      const result = await controller.getUserStats();

      expect(result.total).toBe(100);
    });
  });
});

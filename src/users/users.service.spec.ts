import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../contact/email.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'CLIENT',
        _count: {
          projectsOwned: 5,
          assignments: 3,
          favorites: 2,
          uploadedAssets: 1,
        },
        projectsOwned: [],
        assignments: [],
      });

      const result = await service.getUserProfile('1');

      expect(result.id).toBe('1');
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: '1' });

      const result = await service.updateUserProfile('1', { profileImg: 'new.jpg' });

      expect(result.id).toBe('1');
    });
  });

  describe('getUsers', () => {
    it('should return users list', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.getUsers(1, 20);

      expect(result).toBeDefined();
    });

    it('should filter by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.getUsers(1, 20, 'ADMIN');

      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      const result = await service.getUserById('1');

      expect(result.id).toBe('1');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      mockPrisma.user.update.mockResolvedValue({ id: '1', role: 'ADMIN' });

      const result = await service.updateUserRole('1', 'ADMIN', 'admin');

      expect(result.role).toBe('ADMIN');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      await service.deleteUser('1', 'admin');

      expect(mockPrisma.user.delete).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return stats', async () => {
      mockPrisma.user.count.mockResolvedValue(100);

      const result = await service.getUserStats();

      expect(result.total).toBe(100);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    favorite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFavorite', () => {
    it('should toggle favorite', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj1',
        isPublished: true,
      });
      mockPrisma.favorite.findFirst.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue({
        id: '1',
        isFavorite: true,
      });

      const result = await service.addFavorite('user1', 'proj1');

      expect(result.id).toBe('1');
    });

    it('should remove favorite if exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj1',
        isPublished: true,
      });
      mockPrisma.favorite.findFirst.mockResolvedValue({ id: 'fav1' });
      mockPrisma.favorite.delete.mockResolvedValue({ id: 'fav1' });

      const result = await service.removeFavorite('user1', 'proj1');

      expect(result.id).toBe('fav1');
    });
  });

  describe('list', () => {
    it('should return favorites', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const result = await service.getUserFavorites('user1', 1, 20);

      expect(result).toBeDefined();
    });
  });

  describe('checkIfFavorited', () => {
    it('should check if favorite', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.favorite.findFirst.mockResolvedValue({ id: '1' });

      const result = await service.checkIfFavorited('user1', 'proj1');

      expect(result).toBe(true);
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.favorite.findFirst.mockResolvedValue({ id: 'fav1' });
      mockPrisma.favorite.delete.mockResolvedValue({ id: 'fav1' });

      await service.removeFavorite('user1', 'proj1');

      expect(mockPrisma.favorite.delete).toHaveBeenCalled();
    });
  });
});

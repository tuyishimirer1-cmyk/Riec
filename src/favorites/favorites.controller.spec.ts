import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let service: FavoritesService;

  const mockService = {
    addFavorite: jest.fn(),
    getUserFavorites: jest.fn(),
    removeFavorite: jest.fn(),
    checkIfFavorited: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        {
          provide: FavoritesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addFavorite', () => {
    it('should add favorite', async () => {
      mockService.addFavorite.mockResolvedValue({ id: '1' });

      const result = await controller.addFavorite('proj1', { user: { userId: 'u1' } } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('getMyFavorites', () => {
    it('should return favorites list', async () => {
      mockService.getUserFavorites.mockResolvedValue({ data: [], total: 0, meta: {} });

      const result = await controller.getMyFavorites({ user: { userId: 'u1' } } as any);

      expect(result).toBeDefined();
    });
  });

  describe('checkFavorite', () => {
    it('should check if favorite', async () => {
      mockService.checkIfFavorited.mockResolvedValue(true);

      const result = await controller.checkFavorite('1', { user: { userId: 'u1' } } as any);

      expect(result.favorited).toBe(true);
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite', async () => {
      mockService.removeFavorite.mockResolvedValue({ id: 'fav1' });

      await controller.removeFavorite('1', { user: { userId: 'u1' } } as any);

      expect(mockService.removeFavorite).toHaveBeenCalledWith('u1', '1');
    });
  });
});
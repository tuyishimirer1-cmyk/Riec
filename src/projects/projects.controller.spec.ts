import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectCategory, ProjectType } from '@prisma/client';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockService = {
    create: jest.fn(),
    list: jest.fn(),
    findByIdentifier: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
    getCategories: jest.fn(),
    getProjectsByCategory: jest.fn(),
    getProjectCountByCategory: jest.fn(),
    getCategoriesSummary: jest.fn(),
    addYoutubeVideo: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      mockService.create.mockResolvedValue({ id: '1' });

      const result = await controller.create({ title: 'Test Project' } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('findByIdentifier', () => {
    it('should return project by identifier', async () => {
      mockService.findByIdentifier.mockResolvedValue({ id: '1' });

      const result = await controller.findByIdentifier('test-project');

      expect(result.id).toBe('1');
    });

    it('should pass include param', async () => {
      mockService.findByIdentifier.mockResolvedValue({ id: '1' });

      await controller.findByIdentifier('test-project', 'images,services');

      expect(mockService.findByIdentifier).toHaveBeenCalledWith(
        'test-project',
        'images,services',
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      mockService.update.mockResolvedValue({ id: '1' });

      const result = await controller.update('1', { title: 'Updated' } as any);

      expect(result.id).toBe('1');
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockService.remove.mockResolvedValue({ message: 'deleted' });

      const result = await controller.remove('1');

      expect(result.message).toBe('deleted');
    });
  });

  describe('publish', () => {
    it('should publish a project', async () => {
      mockService.publish.mockResolvedValue({ isPublished: true });

      const result = await controller.publish('1');

      expect(result.isPublished).toBe(true);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a project', async () => {
      mockService.unpublish.mockResolvedValue({ isPublished: false });

      const result = await controller.unpublish('1');

      expect(result.isPublished).toBe(false);
    });
  });

  describe('getCategories', () => {
    it('should return categories', () => {
      mockService.getCategories.mockReturnValue([ProjectCategory.RESIDENTIAL]);

      const result = controller.getCategories();

      expect(result).toEqual([ProjectCategory.RESIDENTIAL]);
    });
  });

  describe('getProjectsByCategory', () => {
    it('should return projects by category', async () => {
      mockService.getProjectsByCategory.mockResolvedValue([]);

      const result = await controller.getProjectsByCategory(
        ProjectCategory.RESIDENTIAL,
      );

      expect(result).toBeDefined();
    });
  });

  describe('getProjectCountByCategory', () => {
    it('should return count by category', async () => {
      mockService.getProjectCountByCategory.mockResolvedValue({ count: 10 });

      const result = await controller.getProjectCountByCategory(
        ProjectCategory.RESIDENTIAL,
      );

      expect(result.count).toBe(10);
    });
  });

  describe('getCategoriesSummary', () => {
    it('should return categories summary', async () => {
      mockService.getCategoriesSummary.mockResolvedValue({ summary: [] });

      const result = await controller.getCategoriesSummary();

      expect(result).toBeDefined();
    });
  });

  describe('addYoutubeVideo', () => {
    it('should add youtube video URL', async () => {
      mockService.addYoutubeVideo.mockResolvedValue({
        id: '1',
        youtubeVideoUrl: 'https://youtube.com',
      });

      const result = await controller.addYoutubeVideo('1', {
        youtubeVideoUrl: 'https://youtube.com',
      });

      expect(result.youtubeVideoUrl).toBe('https://youtube.com');
    });
  });
});

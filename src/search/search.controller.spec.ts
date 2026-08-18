import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let service: SearchService;

  const mockService = {
    globalSearch: jest.fn(),
    searchProjects: jest.fn(),
    searchServices: jest.fn(),
    searchJobs: jest.fn(),
    searchApplications: jest.fn(),
    searchSuggestions: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('globalSearch', () => {
    it('should return global search results', async () => {
      mockService.globalSearch.mockResolvedValue({ data: {}, total: 0 });

      const result = await controller.globalSearch('test');

      expect(result).toBeDefined();
    });

    it('should filter by type', async () => {
      mockService.globalSearch.mockResolvedValue({ data: [], total: 0 });

      await controller.globalSearch('test', 'projects');

      expect(mockService.globalSearch).toHaveBeenCalledWith(
        'test',
        'projects',
        1,
        20,
      );
    });

    it('should use pagination params', async () => {
      mockService.globalSearch.mockResolvedValue({ data: [], total: 0 });

      await controller.globalSearch('test', undefined, 2, 10);

      expect(mockService.globalSearch).toHaveBeenCalledWith(
        'test',
        undefined,
        2,
        10,
      );
    });
  });

  describe('searchProjects', () => {
    it('should return project search results', async () => {
      mockService.searchProjects.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      const result = await controller.searchProjects('villa');

      expect(result).toBeDefined();
    });

    it('should pass filters', async () => {
      mockService.searchProjects.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      await controller.searchProjects(
        'villa',
        'RESIDENTIAL',
        'COMPLETED',
        'Lagos',
        'true',
        1,
        20,
      );

      expect(mockService.searchProjects).toHaveBeenCalledWith(
        'villa',
        expect.objectContaining({
          category: 'RESIDENTIAL',
          type: 'COMPLETED',
          location: 'Lagos',
          featured: true,
        }),
        1,
        20,
      );
    });
  });

  describe('searchServices', () => {
    it('should return service search results', async () => {
      mockService.searchServices.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      const result = await controller.searchServices('architectural');

      expect(result).toBeDefined();
    });
  });

  describe('searchJobs', () => {
    it('should return job search results', async () => {
      mockService.searchJobs.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      const result = await controller.searchJobs('engineer');

      expect(result).toBeDefined();
    });

    it('should pass filters', async () => {
      mockService.searchJobs.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      await controller.searchJobs(
        'engineer',
        'Engineering',
        'Lagos',
        'Full-time',
        'true',
        1,
        20,
      );

      expect(mockService.searchJobs).toHaveBeenCalledWith(
        'engineer',
        expect.objectContaining({
          department: 'Engineering',
          location: 'Lagos',
          employmentType: 'Full-time',
          published: true,
        }),
        1,
        20,
      );
    });
  });

  describe('searchApplications', () => {
    it('should return application search results', async () => {
      mockService.searchApplications.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      const result = await controller.searchApplications('john');

      expect(result).toBeDefined();
    });

    it('should pass filters', async () => {
      mockService.searchApplications.mockResolvedValue({
        data: [],
        total: 0,
        meta: {},
      });

      await controller.searchApplications('john', 'NEW', 'job1', 1, 20);

      expect(mockService.searchApplications).toHaveBeenCalledWith(
        'john',
        expect.objectContaining({ status: 'NEW', jobId: 'job1' }),
        1,
        20,
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', async () => {
      mockService.searchSuggestions.mockResolvedValue({
        projects: [],
        services: [],
        jobs: [],
      });

      const result = await controller.getSuggestions('arch');

      expect(result).toBeDefined();
    });

    it('should use limit param', async () => {
      mockService.searchSuggestions.mockResolvedValue({
        projects: [],
        services: [],
        jobs: [],
      });

      await controller.getSuggestions('arch', 10);

      expect(mockService.searchSuggestions).toHaveBeenCalledWith('arch', 10);
    });
  });
});

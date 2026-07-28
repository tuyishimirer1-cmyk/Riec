import { Test, TestingModule } from '@nestjs/testing';
import { ProjectAssignmentsController } from './project-assignments.controller';
import { ProjectAssignmentsService } from './project-assignments.service';

describe('ProjectAssignmentsController', () => {
  let controller: ProjectAssignmentsController;
  let service: ProjectAssignmentsService;

  const mockService = {
    assign: jest.fn(),
    list: jest.fn(),
    updateRole: jest.fn(),
    unassign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectAssignmentsController],
      providers: [
        {
          provide: ProjectAssignmentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectAssignmentsController>(ProjectAssignmentsController);
    service = module.get<ProjectAssignmentsService>(ProjectAssignmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('assign', () => {
    it('should assign user to project', async () => {
      mockService.assign.mockResolvedValue({ id: '1' });

      const result = await controller.assign('proj1', { userId: 'u1' });

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return assignments', async () => {
      mockService.list.mockResolvedValue({ data: [], total: 0, meta: {} });

      const result = await controller.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('updateRole', () => {
    it('should update assignment', async () => {
      mockService.updateRole.mockResolvedValue({ id: '1' });

      const result = await controller.updateRole('proj1', 'assign1', 'lead');

      expect(result.id).toBe('1');
    });
  });

  describe('unassign', () => {
    it('should remove assignment', async () => {
      mockService.unassign.mockResolvedValue({ id: '1' });

      await controller.unassign('proj1', 'assign1');

      expect(mockService.unassign).toHaveBeenCalledWith('proj1', 'assign1');
    });
  });
});
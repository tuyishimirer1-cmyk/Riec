import { Test, TestingModule } from '@nestjs/testing';
import { ProjectAssignmentsService } from './project-assignments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectAssignmentsService', () => {
  let service: ProjectAssignmentsService;
  let prisma: PrismaService;

  const mockPrisma = {
    projectAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAssignmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectAssignmentsService>(ProjectAssignmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assign', () => {
    it('should assign user to project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.projectAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.projectAssignment.create.mockResolvedValue({ id: '1' });

      const result = await service.assign('proj1', { userId: 'u1' }, 'admin');

      expect(result.id).toBe('1');
    });
  });

  describe('list', () => {
    it('should return assignments', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj1' });
      mockPrisma.projectAssignment.findMany.mockResolvedValue([]);

      const result = await service.list('proj1');

      expect(result).toBeDefined();
    });
  });

  describe('updateRole', () => {
    it('should update assignment', async () => {
      mockPrisma.projectAssignment.findFirst.mockResolvedValue({
        id: 'assign1',
      });
      mockPrisma.projectAssignment.update.mockResolvedValue({ id: '1' });

      const result = await service.updateRole('proj1', 'assign1', 'lead');

      expect(result.id).toBe('1');
    });
  });

  describe('unassign', () => {
    it('should remove assignment', async () => {
      mockPrisma.projectAssignment.findFirst.mockResolvedValue({
        id: 'assign1',
      });
      mockPrisma.projectAssignment.delete.mockResolvedValue({ id: 'assign1' });

      await service.unassign('proj1', 'assign1');

      expect(mockPrisma.projectAssignment.delete).toHaveBeenCalled();
    });
  });
});

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class ProjectAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(projectId: string, dto: CreateAssignmentDto) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
    ]);
    if (!project) throw new NotFoundException('Project not found');
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.projectAssignment.findFirst({
      where: { projectId, userId: dto.userId },
    });
    if (existing)
      throw new ConflictException('User already assigned to this project');

    return this.prisma.projectAssignment.create({
      data: { projectId, userId: dto.userId, role: dto.role },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async list(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.projectAssignment.findMany({
      where: { projectId },
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async updateRole(projectId: string, assignmentId: string, role: string) {
    const assignment = await this.prisma.projectAssignment.findFirst({
      where: { id: assignmentId, projectId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.prisma.projectAssignment.update({
      where: { id: assignmentId },
      data: { role },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async unassign(projectId: string, assignmentId: string) {
    const assignment = await this.prisma.projectAssignment.findFirst({
      where: { id: assignmentId, projectId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.projectAssignment.delete({ where: { id: assignmentId } });
  }
}

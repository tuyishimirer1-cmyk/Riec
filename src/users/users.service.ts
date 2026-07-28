import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../auth/role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profileImg: true,
        coverImg: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
        projectsOwned: {
          select: {
            id: true,
            title: true,
            slug: true,
            isPublished: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        assignments: {
          select: {
            id: true,
            role: true,
            assignedAt: true,
            project: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            projectsOwned: true,
            assignments: true,
            favorites: true,
            uploadedAssets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transform to match frontend expectations
    return {
      ...user,
      stats: {
        projectsCount: user._count.projectsOwned,
        assignmentsCount: user._count.assignments,
        favoritesCount: user._count.favorites,
        uploadsCount: user._count.uploadedAssets,
      },
      // Rename arrays for clarity
      projects: user.projectsOwned,
      assignments: user.assignments,
    };
  }

  async updateUserProfile(userId: string, updateData: any) {
    // Only allow updating profileImg and coverImg
    const allowedFields = ['profileImg', 'coverImg'];
    const updateFields: any = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateFields,
      select: {
        id: true,
        email: true,
        role: true,
        profileImg: true,
        coverImg: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
      },
    });
  }

  async getUsers(page: number, limit: number, role?: Role) {
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          profileImg: true,
          coverImg: true,
          createdAt: true,
          lastLoginAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        profileImg: true,
        coverImg: true,
        createdAt: true,
        lastLoginAt: true,
        updatedAt: true,
        projectsOwned: true,
        assignments: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(id: string, newRole: Role, requesterId: string) {
    // Prevent self-downgrade
    if (id === requesterId && newRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Cannot downgrade your own admin role. Please contact another admin.',
      );
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
        profileImg: true,
        coverImg: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string, requesterId: string) {
    // Prevent self-deletion
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async getUserStats() {
    const [total, adminCount, engineerCount, companyWorkerCount, clientCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: Role.ADMIN } }),
        this.prisma.user.count({ where: { role: Role.ENGINEER } }),
        this.prisma.user.count({ where: { role: Role.COMPANY_WORKER } }),
        this.prisma.user.count({ where: { role: Role.CLIENT } }),
      ]);

    return {
      total,
      ADMIN: adminCount,
      ENGINEER: engineerCount,
      COMPANY_WORKER: companyWorkerCount,
      CLIENT: clientCount,
    };
  }
}

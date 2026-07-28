import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { paginate } from '../common/utils/pagination.util';
import {
  generateUniqueSlug,
  sanitizeSlug,
  isValidSlug,
} from '../common/utils/slug.util';

@Injectable()
export class CareersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a job slug exists (excluding a specific ID)
   */
  private async jobSlugExists(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await this.prisma.job.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return !!existing;
  }

  async create(data: CreateJobDto) {
    // Generate slug from title
    const slug = await generateUniqueSlug(data.title, (slugToCheck) =>
      this.jobSlugExists(slugToCheck),
    );

    return this.prisma.job.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  async list(
    filters: {
      location?: string;
      department?: string;
      type?: string;
      published?: boolean;
    },
    page: number,
    limit: number,
  ) {
    const { skip, take, meta } = paginate(page, limit);

    const where = {
      ...(filters.published !== undefined
        ? { isPublished: filters.published }
        : {}),
      ...(filters.location
        ? {
            location: {
              contains: filters.location,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.department
        ? {
            department: {
              contains: filters.department,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.type
        ? {
            employmentType: {
              contains: filters.type,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          _count: {
            select: { applications: true },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data: items, ...meta(total) };
  }

  async listPublished(
    filters: { location?: string; department?: string; type?: string },
    pagination: { skip: number; take: number },
  ) {
    const where = {
      isPublished: true,
      ...(filters.location
        ? {
            location: {
              contains: filters.location,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.department
        ? {
            department: {
              contains: filters.department,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.type
        ? {
            employmentType: {
              contains: filters.type,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data: items, total };
  }

  // Admin: get job by ID or slug (includes unpublished)
  async findByIdentifier(identifier: string) {
    // Try ID first if it looks like a MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      const job = await this.prisma.job.findUnique({
        where: { id: identifier },
        include: {
          _count: { select: { applications: true } },
        },
      });
      if (job) return job;
    }

    // Try slug
    const job = await this.prisma.job.findFirst({
      where: { slug: identifier },
      include: {
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  // Public: get published job by ID or slug
  async findPublicByIdentifier(identifier: string) {
    // Try ID with published filter
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      const job = await this.prisma.job.findFirst({
        where: { id: identifier, isPublished: true },
        include: {
          _count: { select: { applications: true } },
        },
      });
      if (job) return job;
    }

    // Try slug with published filter
    const job = await this.prisma.job.findFirst({
      where: { slug: identifier, isPublished: true },
    });

    if (!job) throw new NotFoundException('Job not found or not published');
    return job;
  }

  async update(identifier: string, data: CreateJobDto) {
    const job = await this.findByIdentifier(identifier);
    return this.updateJob(job.id, data);
  }

  async updateJob(id: string, data: CreateJobDto) {
    // Generate new slug from title
    const slug = await generateUniqueSlug(data.title, (slugToCheck) =>
      this.jobSlugExists(slugToCheck, id),
    );

    return this.prisma.job.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
    });
  }

  async remove(identifier: string) {
    const job = await this.findByIdentifier(identifier);
    return this.prisma.job.delete({ where: { id: job.id } });
  }

  async publish(identifier: string) {
    const job = await this.findByIdentifier(identifier);
    return this.prisma.job.update({
      where: { id: job.id },
      data: { isPublished: true },
    });
  }

  async unpublish(identifier: string) {
    const job = await this.findByIdentifier(identifier);
    return this.prisma.job.update({
      where: { id: job.id },
      data: { isPublished: false },
    });
  }

  async getStats() {
    const [total, published, byDepartment, byLocation, byType] =
      await this.prisma.$transaction([
        this.prisma.job.count(),
        this.prisma.job.count({ where: { isPublished: true } }),
        this.prisma.job.groupBy({
          by: ['department'],
          _count: { _all: true },
          orderBy: { department: 'asc' },
        }),
        this.prisma.job.groupBy({
          by: ['location'],
          _count: { _all: true },
          orderBy: { location: 'asc' },
        }),
        this.prisma.job.groupBy({
          by: ['employmentType'],
          _count: { _all: true },
          orderBy: { employmentType: 'asc' },
        }),
      ]);

    return {
      total,
      published,
      byDepartment,
      byLocation,
      byType,
    };
  }
}

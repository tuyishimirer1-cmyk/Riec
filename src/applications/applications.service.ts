import { Injectable } from '@nestjs/common';
import { JobApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { BulkUpdateApplicationsDto } from './dto/bulk-update-applications.dto';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    jobId: string;
    fullName: string;
    email: string;
    phone?: string;
    coverLetter?: string;
    cvUrl?: string;
    cvS3Key?: string;
  }) {
    return this.prisma.jobApplication.create({ 
      data,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            department: true,
            location: true,
          },
        },
      },
    });
  }

  async list(
    filters: {
      jobId?: string;
      status?: JobApplicationStatus;
      department?: string;
      location?: string;
      search?: string;
    },
    page: number,
    limit: number,
  ) {
    const { skip, take, meta } = paginate(page, limit);
    
    const where: any = {
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? {
        OR: [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(filters.department || filters.location ? {
        job: {
          ...(filters.department ? { department: { contains: filters.department, mode: 'insensitive' } } : {}),
          ...(filters.location ? { location: { contains: filters.location, mode: 'insensitive' } } : {}),
        },
      } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              department: true,
              location: true,
              employmentType: true,
            },
          },
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return { data: items, ...meta(total) };
  }

  async listForJob(
    jobId: string,
    status: JobApplicationStatus | undefined,
    pagination: { skip: number; take: number },
  ) {
    const where: {
      jobId: string;
      status?: JobApplicationStatus;
    } = {
      jobId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              slug: true,
              department: true,
              location: true,
            },
          },
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return { data: items, total };
  }

  findOne(id: string) {
    return this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            department: true,
            location: true,
            employmentType: true,
            description: true,
            requirements: true,
            responsibilities: true,
          },
        },
      },
    });
  }

  update(id: string, data: UpdateApplicationDto) {
    return this.prisma.jobApplication.update({
      where: { id },
      data,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            department: true,
            location: true,
          },
        },
      },
    });
  }

  async bulkUpdate(data: BulkUpdateApplicationsDto) {
    const result = await this.prisma.jobApplication.updateMany({
      where: {
        id: { in: data.applicationIds },
      },
      data: {
        status: data.status,
      },
    });

    return {
      message: `Updated ${result.count} applications to ${data.status}`,
      updatedCount: result.count,
    };
  }

  remove(id: string) {
    return this.prisma.jobApplication.delete({ where: { id } });
  }

  async getStats(jobId?: string) {
    const baseWhere = jobId ? { jobId } : {};
    
    const [total, byStatus, byJob, recentApplications] = await this.prisma.$transaction([
      this.prisma.jobApplication.count({ where: baseWhere }),
      this.prisma.jobApplication.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      ...(jobId ? [] : [
        this.prisma.jobApplication.groupBy({
          by: ['jobId'],
          _count: { _all: true },
          orderBy: { jobId: 'asc' },
          take: 10,
        }),
      ]),
      this.prisma.jobApplication.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      total,
      byStatus,
      ...(jobId ? {} : { byJob }),
      recentApplications,
    };
  }

  async getApplicationsByDateRange(startDate: Date, endDate: Date, jobId?: string) {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(jobId ? { jobId } : {}),
    };

    return this.prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            department: true,
            location: true,
          },
        },
      },
    });
  }

  async exportApplications(jobId?: string, status?: JobApplicationStatus) {
    const where = {
      ...(jobId ? { jobId } : {}),
      ...(status ? { status } : {}),
    };

    return this.prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            title: true,
            department: true,
            location: true,
            employmentType: true,
          },
        },
      },
    });
  }
}



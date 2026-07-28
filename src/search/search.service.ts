import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/pagination.util';
import {
  ProjectCategory,
  ProjectType,
  JobApplicationStatus,
} from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, type?: string, page = 1, limit = 20) {
    const { skip, take, meta } = paginate(page, limit);

    if (type) {
      switch (type) {
        case 'projects':
          return this.searchProjects(query, {}, page, limit);
        case 'services':
          return this.searchServices(query, page, limit);
        case 'jobs':
          return this.searchJobs(query, {}, page, limit);
        case 'applications':
          return this.searchApplications(query, {}, page, limit);
        default:
          return { data: [], total: 0, meta: meta(0) };
      }
    }

    // Search across all entities
    const [projects, services, jobs, applications] = await Promise.all([
      this.searchProjects(query, {}, 1, 5),
      this.searchServices(query, 1, 5),
      this.searchJobs(query, { published: true }, 1, 5),
      this.searchApplications(query, {}, 1, 5),
    ]);

    const results = {
      projects: projects.data,
      services: services.data,
      jobs: jobs.data,
      applications: applications.data,
      totals: {
        projects: projects.total,
        services: services.total,
        jobs: jobs.total,
        applications: applications.total,
      },
    };

    return {
      data: results,
      total: Object.values(results.totals).reduce((a, b) => a + b, 0),
    };
  }

  async searchProjects(
    query: string,
    filters: {
      category?: string;
      type?: string;
      location?: string;
      featured?: boolean;
    },
    page = 1,
    limit = 20,
    include?: string,
  ) {
    const { skip, take, meta } = paginate(page, limit);

    const where: any = {
      isPublished: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters.category) where.category = filters.category as ProjectCategory;
    if (filters.type) where.type = filters.type as ProjectType;
    if (filters.location)
      where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.featured !== undefined) where.featured = filters.featured;

    const includeObj: any = {};

    if (include) {
      const relations = include.split(',').map((r) => r.trim());

      relations.forEach((relation) => {
        switch (relation) {
          case 'images':
            includeObj.images = { orderBy: { order: 'asc' }, take: 1 };
            break;
          case 'service':
          case 'services':
            includeObj.services = {
              include: {
                service: { select: { id: true, name: true } },
              },
            };
            break;
          case 'assets':
            includeObj.assets = {
              include: {
                uploadedBy: { select: { id: true, email: true, role: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 3,
            };
            break;
          case 'pricingTiers':
            includeObj.pricingTiers = {
              where: { isActive: true },
              orderBy: { amount: 'asc' },
            };
            break;
          case 'owner':
            includeObj.owner = {
              select: { id: true, email: true, role: true },
            };
            break;
          case 'assignments':
            includeObj.assignments = {
              include: {
                user: { select: { id: true, email: true, role: true } },
              },
            };
            break;
          case 'purchases':
            includeObj.purchases = { orderBy: { createdAt: 'desc' } };
            break;
          case 'counts':
            includeObj._count = { select: { pricingTiers: true } };
            break;
        }
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: includeObj,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async searchServices(query: string, page = 1, limit = 20) {
    const { skip, take, meta } = paginate(page, limit);

    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { detailedDescription: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          _count: { select: { projects: true } },
        },
        orderBy: { order: 'asc' },
        skip,
        take,
      }),
      this.prisma.service.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async searchJobs(
    query: string,
    filters: {
      department?: string;
      location?: string;
      employmentType?: string;
      published?: boolean;
    },
    page = 1,
    limit = 20,
  ) {
    const { skip, take, meta } = paginate(page, limit);

    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { requirements: { contains: query, mode: 'insensitive' } },
        { responsibilities: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters.published !== undefined) where.isPublished = filters.published;
    if (filters.department)
      where.department = { contains: filters.department, mode: 'insensitive' };
    if (filters.location)
      where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.employmentType)
      where.employmentType = {
        contains: filters.employmentType,
        mode: 'insensitive',
      };

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          _count: { select: { applications: true } },
        },
        orderBy: [{ isPublished: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async searchApplications(
    query: string,
    filters: {
      status?: string;
      jobId?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const { skip, take, meta } = paginate(page, limit);

    const where: any = {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { coverLetter: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters.status) where.status = filters.status as JobApplicationStatus;
    if (filters.jobId) where.jobId = filters.jobId;

    const [data, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async searchSuggestions(query: string, limit = 5) {
    const suggestions = await Promise.all([
      // Project titles
      this.prisma.project.findMany({
        where: {
          isPublished: true,
          title: { contains: query, mode: 'insensitive' },
        },
        select: { title: true, slug: true },
        take: limit,
      }),
      // Service names
      this.prisma.service.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        select: { name: true },
        take: limit,
      }),
      // Job titles
      this.prisma.job.findMany({
        where: {
          isPublished: true,
          title: { contains: query, mode: 'insensitive' },
        },
        select: { title: true, slug: true },
        take: limit,
      }),
    ]);

    return {
      projects: suggestions[0].map((p) => ({
        text: p.title,
        slug: p.slug,
        type: 'project',
      })),
      services: suggestions[1].map((s) => ({ text: s.name, type: 'service' })),
      jobs: suggestions[2].map((j) => ({
        text: j.title,
        slug: j.slug,
        type: 'job',
      })),
    };
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectCategory, ProjectType } from '@prisma/client';
import { paginate } from '../common/utils/pagination.util';
import { generateSlug, generateUniqueSlug } from '../common/utils/slug.util';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseIncludeQuery(include?: string) {
    if (!include) return {};

    const relations = include.split(',').map((r) => r.trim());
    const includeObj: any = {};

    relations.forEach((relation) => {
      switch (relation) {
        case 'images':
          includeObj.images = { orderBy: { order: 'asc' } };
          break;
        case 'service':
        case 'services':
          includeObj.services = {
            include: {
              service: true,
            },
          };
          break;
        case 'assets':
          includeObj.assets = {
            include: {
              uploadedBy: { select: { id: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          };
          break;
        case 'pricingTiers':
          includeObj.pricingTiers = {
            where: { isActive: true },
            orderBy: { amount: 'asc' },
          };
          break;
        case 'owner':
          includeObj.owner = { select: { id: true, email: true, role: true } };
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
          includeObj._count = {
            select: {
              images: true,
              assets: true,
              pricingTiers: true,
              purchases: true,
            },
          };
          break;
      }
    });

    return includeObj;
  }

  async create(dto: CreateProjectDto) {
    const { serviceSlugs, ...rest } = dto;

    // Validate title produces a usable slug
    const baseSlug = generateSlug(dto.title);
    if (!baseSlug) {
      throw new BadRequestException(
        'Project title must contain at least one letter or number',
      );
    }

    let slug: string;
    try {
      slug = await generateUniqueSlug(dto.title, (s) =>
        this.prisma.project.findUnique({ where: { slug: s } }).then(Boolean),
      );
    } catch (err) {
      Logger.error(`Slug generation failed for title "${dto.title}": ${err}`);
      throw new InternalServerErrorException(
        'Failed to generate a unique URL slug for this project title',
      );
    }

    const data: any = { ...rest, slug };

    // Create the project first (without nested relations to avoid MongoDB join-table issues)
    let project;
    try {
      project = await this.prisma.project.create({ data });
    } catch (err) {
      Logger.error(`Project creation failed: ${err}`);
      if (err?.code === 'P2002') {
        throw new BadRequestException(
          'A project with this title or slug already exists',
        );
      }
      throw new InternalServerErrorException(
        'Failed to create project. Please check your input and try again.',
      );
    }

    // Handle many-to-many service relationships via explicit join-table inserts
    if (serviceSlugs && serviceSlugs.length > 0) {
      try {
        const trimmedServiceSlugs = serviceSlugs.map((s) => s.trim());
        const services = await this.prisma.service.findMany({
          where: { slug: { in: trimmedServiceSlugs } },
          select: { id: true },
        });
        if (services.length > 0) {
          await this.prisma.projectService.createMany({
            data: services.map((svc) => ({
              projectId: project.id,
              serviceId: svc.id,
            })),
          });
        }
      } catch (err) {
        Logger.error(
          `Service relation creation failed for project ${project.id}: ${err}`,
        );
        // The project was created, just services didn't attach — surface warning
        throw new BadRequestException(
          'Project created but failed to attach some services. Please edit the project to add services.',
        );
      }
    }

    // Return project with services included
    try {
      return await this.prisma.project.findUnique({
        where: { id: project.id },
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      });
    } catch (err) {
      Logger.error(`Failed to fetch created project ${project.id}: ${err}`);
      // Return the project object we already have as fallback
      return project;
    }
  }

  async list(
    filters: {
      service?: string;
      location?: string;
      featured?: boolean;
      type?: ProjectType;
      category?: ProjectCategory;
      isPublished?: boolean;
    },
    page = 1,
    limit = 20,
    include?: string,
  ) {
    const { skip, take, meta } = paginate(page, limit);
    const where: any = {};

    // Default to published-only for public views; omit filter when explicitly undefined
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    } else {
      where.isPublished = true;
    }

    if (filters.service) {
      const trimmedService = filters.service.trim();
      const service = await this.prisma.service.findFirst({
        where: { slug: trimmedService },
        select: { id: true },
      });
      if (service) {
        where.services = {
          some: {
            serviceId: service.id,
          },
        };
      }
    }
    if (filters.location)
      where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;

    const includeRelations = this.parseIncludeQuery(include);

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: includeRelations,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async findOne(id: string, include?: string) {
    const includeRelations = this.parseIncludeQuery(include);
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async getBySlug(slug: string, include?: string) {
    const includeRelations = this.parseIncludeQuery(include);
    const project = await this.prisma.project.findUnique({
      where: { slug: slug.trim() },
      include: includeRelations,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findByIdentifier(identifier: string, include?: string) {
    const includeRelations = this.parseIncludeQuery(include);
    const trimmedIdentifier = identifier.trim();

    // Try to find by ID first (MongoDB ObjectId format)
    if (trimmedIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      const project = await this.prisma.project.findUnique({
        where: { id: trimmedIdentifier },
        include: includeRelations,
      });
      if (project) return project;
    }

    // If not found by ID or doesn't look like an ID, try by slug
    const project = await this.prisma.project.findUnique({
      where: { slug: trimmedIdentifier },
      include: includeRelations,
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(identifier: string, dto: Partial<CreateProjectDto>) {
    const project = await this.findByIdentifier(identifier);
    const { serviceSlugs, ...rest } = dto as CreateProjectDto;

    const data: any = { ...rest };

    if (data.title) {
      const slug = await generateUniqueSlug(data.title, (s) =>
        this.prisma.project
          .findUnique({ where: { slug: s }, select: { id: true } })
          .then((p) => !!p && p.id !== project.id),
      );
      data.slug = slug;
    }

    // Update project fields first (without services relation to avoid MongoDB nested-set issues)
    await this.prisma.project.update({
      where: { id: project.id },
      data,
    });

    // Handle many-to-many service relationships via explicit join-table operations
    if (serviceSlugs !== undefined) {
      // Delete ALL existing ProjectService records for this project
      await this.prisma.projectService.deleteMany({
        where: { projectId: project.id },
      });

      if (serviceSlugs.length > 0) {
        const trimmedServiceSlugs = serviceSlugs.map((s) => s.trim());
        const services = await this.prisma.service.findMany({
          where: { slug: { in: trimmedServiceSlugs } },
          select: { id: true },
        });
        if (services.length > 0) {
          await this.prisma.projectService.createMany({
            data: services.map((svc) => ({
              projectId: project.id,
              serviceId: svc.id,
            })),
          });
        }
      }
    }

    // Return project with services included
    return this.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  async remove(identifier: string) {
    const project = await this.findByIdentifier(identifier);
    
    // Delete all related data in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete project services
      await tx.projectService.deleteMany({ where: { projectId: project.id } });
      
      // Delete project images
      await tx.projectImage.deleteMany({ where: { projectId: project.id } });
      
      // Delete project pricing tiers
      await tx.projectPriceTier.deleteMany({ where: { projectId: project.id } });
      
      // Delete project assets
      await tx.projectAsset.deleteMany({ where: { projectId: project.id } });
      
      // Delete project assignments
      await tx.projectAssignment.deleteMany({ where: { projectId: project.id } });
      
      // Note: Purchases are kept for records (change to deleteMany if needed)
      // await tx.purchase.deleteMany({ where: { projectId: project.id } });
      
      // Finally, delete the project itself
      await tx.project.delete({ where: { id: project.id } });
    });
  }

  async publish(identifier: string) {
    const project = await this.findByIdentifier(identifier);
    return this.prisma.project.update({
      where: { id: project.id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(identifier: string) {
    const project = await this.findByIdentifier(identifier);
    return this.prisma.project.update({
      where: { id: project.id },
      data: { isPublished: false },
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getCategories() {
    return Object.values(ProjectCategory);
  }

  async getProjectsByCategory(category: ProjectCategory, page = 1, limit = 20) {
    const { skip, take, meta } = paginate(page, limit);
    const where = { category, isPublished: true };
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total, meta: meta(total) };
  }

  async getProjectCountByCategory(category: ProjectCategory) {
    const count = await this.prisma.project.count({
      where: { category, isPublished: true },
    });
    return { category, count };
  }

  async getCategoriesSummary() {
    const categories = Object.values(ProjectCategory);
    const counts = await Promise.all(
      categories.map((category) =>
        this.prisma.project
          .count({ where: { category, isPublished: true } })
          .then((count) => ({ category, count })),
      ),
    );
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    const summary = counts.map((c) => ({
      ...c,
      percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
    }));
    return { categories: counts, total, summary };
  }

  async addYoutubeVideo(identifier: string, youtubeVideoUrl: string) {
    const project = await this.findByIdentifier(identifier);
    if (project.type !== ProjectType.COMPLETED) {
      throw new BadRequestException(
        'YouTube video URL can only be added to completed projects',
      );
    }
    return this.prisma.project.update({
      where: { id: project.id },
      data: { youtubeVideoUrl },
    });
  }
}

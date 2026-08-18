import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private parseIncludeQuery(include?: string) {
    if (!include) return {};

    const relations = include.split(',').map((rel) => rel.trim());
    const includeObj: any = {};

    relations.forEach((relation) => {
      switch (relation) {
        case 'images':
          includeObj.images = { orderBy: { order: 'asc' } };
          break;
        case 'projects':
          includeObj.projects = {
            where: { project: { isPublished: true } },
            include: {
              project: {
                include: {
                  images: { orderBy: { order: 'asc' }, take: 1 },
                  _count: { select: { pricingTiers: true } },
                },
              },
            },
            orderBy: [{ createdAt: 'desc' }],
            take: 5,
          };
          break;
        case 'counts':
          includeObj._count = { select: { projects: true } };
          break;
      }
    });

    return includeObj;
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  async list(page = 1, limit = 20, include?: string) {
    const { skip, take, meta } = paginate(page, limit);

    const includeRelations = this.parseIncludeQuery(include);

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        orderBy: { order: 'asc' },
        include: includeRelations,
        skip,
        take,
      }),
      this.prisma.service.count(),
    ]);
    return { data, total, meta: meta(total) };
  }

  async findOne(id: string, include?: string) {
    const includeRelations = this.parseIncludeQuery(include);

    const service = await this.prisma.service.findUnique({
      where: { id },
      include: includeRelations,
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async findByIdentifier(identifier: string, include?: string) {
    const includeRelations = this.parseIncludeQuery(include);

    // Try to find by ID first (MongoDB ObjectId format)
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      const service = await this.prisma.service.findUnique({
        where: { id: identifier },
        include: includeRelations,
      });
      if (service) return service;
    }

    // If not found by ID or doesn't look like an ID, try by slug
    const trimmedIdentifier = identifier.trim();
    const service = await this.prisma.service.findUnique({
      where: { slug: trimmedIdentifier },
      include: includeRelations,
    });

    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(identifier: string, dto: Partial<CreateServiceDto>) {
    const service = await this.findByIdentifier(identifier);
    return this.prisma.service.update({ where: { id: service.id }, data: dto });
  }

  async remove(identifier: string) {
    const service = await this.findByIdentifier(identifier);
    await this.prisma.service.delete({ where: { id: service.id } });
  }

  async publish(identifier: string) {
    const service = await this.findByIdentifier(identifier);
    return this.prisma.service.update({
      where: { id: service.id },
      data: { isPublished: true },
    });
  }

  async unpublish(identifier: string) {
    const service = await this.findByIdentifier(identifier);
    return this.prisma.service.update({
      where: { id: service.id },
      data: { isPublished: false },
    });
  }
}

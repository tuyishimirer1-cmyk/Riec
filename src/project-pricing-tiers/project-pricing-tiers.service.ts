import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceTierDto } from './dto/create-price-tier.dto';

@Injectable()
export class ProjectPricingTiersService {
  constructor(private readonly prisma: PrismaService) {}

  private async findTierOrFail(projectId: string, tierId: string) {
    const tier = await this.prisma.projectPriceTier.findFirst({
      where: { id: tierId, projectId },
    });
    if (!tier) throw new NotFoundException('Pricing tier not found');
    return tier;
  }

  async create(projectId: string, dto: CreatePriceTierDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.prisma.projectPriceTier.create({ data: { ...dto, projectId } });
  }

  async list(projectId: string, onlyActive?: boolean) {
    const where: any = { projectId };
    if (onlyActive) where.isActive = true;
    return this.prisma.projectPriceTier.findMany({
      where,
      include: {
        assets: {
          select: {
            id: true,
            documentType: true,
            filename: true,
            isDownloadable: true,
          },
        },
      },
      orderBy: { amount: 'asc' },
    });
  }

  async findOne(projectId: string, tierId: string) {
    return this.findTierOrFail(projectId, tierId);
  }

  async update(
    projectId: string,
    tierId: string,
    dto: Partial<CreatePriceTierDto>,
  ) {
    await this.findTierOrFail(projectId, tierId);
    return this.prisma.projectPriceTier.update({
      where: { id: tierId },
      data: dto,
    });
  }

  async remove(projectId: string, tierId: string) {
    await this.findTierOrFail(projectId, tierId);
    await this.prisma.projectPriceTier.delete({ where: { id: tierId } });
  }
}

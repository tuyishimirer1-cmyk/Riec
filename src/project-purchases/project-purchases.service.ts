import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { paginate } from '../common/utils/pagination.util';
import { PurchaseStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async create(projectId: string, dto: CreatePurchaseDto) {
    const [project, tier] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: projectId } }),
      this.prisma.projectPriceTier.findFirst({
        where: { id: dto.tierId, projectId },
      }),
    ]);
    if (!project) throw new NotFoundException('Project not found');
    if (!tier) throw new NotFoundException('Pricing tier not found');

    return this.prisma.purchase.create({
      data: {
        projectId,
        tierId: dto.tierId,
        email: dto.email,
        fullName: dto.fullName,
        flutterwaveRef: dto.flutterwaveRef,
        currency: dto.currency,
        amount: dto.amount,
        status: PurchaseStatus.PENDING,
      },
      include: {
        tier: {
          select: { id: true, name: true, currency: true, amount: true },
        },
      },
    });
  }

  async list(projectId: string, page = 1, limit = 20) {
    const { skip, take, meta } = paginate(page, limit);
    const where = { projectId };

    const [data, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          tier: {
            select: { id: true, name: true, currency: true, amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async findOne(projectId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, projectId },
      include: {
        tier: {
          select: { id: true, name: true, currency: true, amount: true },
        },
        project: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async updateStatus(
    projectId: string,
    purchaseId: string,
    status: PurchaseStatus,
  ) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, projectId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { status },
    });
  }

  async getDownloadLinks(projectId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, projectId },
      include: {
        tier: { include: { assets: { where: { isDownloadable: true } } } },
      },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status !== PurchaseStatus.SUCCESS) {
      throw new ForbiddenException('Purchase has not been completed');
    }

    const urls = await Promise.all(
      purchase.tier.assets.map(async (asset) => ({
        assetId: asset.id,
        filename: asset.filename,
        documentType: asset.documentType,
        url: await this.s3.generatePrivateSignedUrl(asset.s3Key),
      })),
    );

    return { purchaseId, urls };
  }

  async generateDownloadToken(projectId: string, purchaseId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id: purchaseId, projectId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status !== PurchaseStatus.SUCCESS) {
      throw new ForbiddenException('Purchase has not been completed');
    }
    const token = randomBytes(32).toString('hex');
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { downloadToken: token },
    });
    return { token };
  }

  /**
   * Get purchases for the authenticated user (by email)
   */
  async getMyPurchases(email: string, page = 1, limit = 20) {
    const { skip, take, meta } = paginate(page, limit);
    const where = { email };

    const [data, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where,
        include: {
          project: { select: { id: true, title: true, slug: true } },
          tier: {
            select: { id: true, name: true, currency: true, amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }
}

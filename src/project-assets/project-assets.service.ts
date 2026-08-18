/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { paginate } from '../common/utils/pagination.util';
import { ProjectDocumentType } from '@prisma/client';

@Injectable()
export class ProjectAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async findAssetOrFail(projectId: string, assetId: string) {
    const asset = await this.prisma.projectAsset.findFirst({
      where: { id: assetId, projectId },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async upload(
    projectId: string,
    files: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    }[],
    dto: CreateAssetDto,
    userId?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return Promise.all(
      files.map(async (file) => {
        const result = await this.cloudinary.uploadFile(
          file,
          `riec/projects/${projectId}/documents`,
        );
        return this.prisma.projectAsset.create({
          data: {
            projectId,
            tierId: dto.tierId?.trim() || undefined,
            documentType: dto.documentType,
            version: dto.version?.trim() || undefined,
            s3Key: result.publicId,
            filename: file.originalname,
            fileType: file.mimetype,
            size: file.size,
            uploadedById: userId?.trim() || undefined,
          },
          include: {
            uploadedBy: { select: { id: true, email: true, role: true } },
          },
        });
      }),
    );
  }

  async list(
    projectId: string,
    filters: { tierId?: string; documentType?: ProjectDocumentType },
    page = 1,
    limit = 20,
  ) {
    const { skip, take, meta } = paginate(page, limit);
    const where: any = { projectId };
    if (filters.tierId) where.tierId = filters.tierId;
    if (filters.documentType) where.documentType = filters.documentType;

    const [data, total] = await Promise.all([
      this.prisma.projectAsset.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, email: true, role: true } },
          tier: {
            select: { id: true, name: true, currency: true, amount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.projectAsset.count({ where }),
    ]);

    return { data, total, meta: meta(total) };
  }

  async findOne(projectId: string, assetId: string) {
    return this.findAssetOrFail(projectId, assetId);
  }

  async update(
    projectId: string,
    assetId: string,
    data: { isDownloadable?: boolean; version?: string },
  ) {
    await this.findAssetOrFail(projectId, assetId);
    return this.prisma.projectAsset.update({ where: { id: assetId }, data });
  }

  async remove(projectId: string, assetId: string) {
    const asset = await this.findAssetOrFail(projectId, assetId);
    await this.cloudinary.deleteFile(asset.s3Key);
    await this.prisma.projectAsset.delete({ where: { id: assetId } });
  }

  async getDownloadUrl(projectId: string, assetId: string) {
    const asset = await this.findAssetOrFail(projectId, assetId);
    if (!asset.isDownloadable)
      throw new ForbiddenException('Asset is not downloadable');
    const url = await this.cloudinary.generateSignedUrl(asset.s3Key);
    return { url, filename: asset.filename, fileType: asset.fileType };
  }
}

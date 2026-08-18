import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateImageDto } from './dto/update-image.dto';

@Injectable()
export class ProjectImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: CloudinaryService,
  ) {}

  private async assertProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
  }

  async upload(
    projectId: string,
    files: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    }[],
    captions?: string[],
  ) {
    await this.assertProject(projectId);
    const existing = await this.prisma.projectImage.count({
      where: { projectId },
    });

    return Promise.all(
      files.map(async (file, idx) => {
        const result = await this.storage.uploadFile(
          file,
          `riec/projects/${projectId}/images`,
        );
        return this.prisma.projectImage.create({
          data: {
            projectId,
            s3Key: result.publicId,
            url: result.secureUrl,
            caption: captions?.[idx],
            order: existing + idx,
          },
        });
      }),
    );
  }

  async list(projectId: string) {
    await this.assertProject(projectId);
    return this.prisma.projectImage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async update(projectId: string, imageId: string, dto: UpdateImageDto) {
    const image = await this.prisma.projectImage.findFirst({
      where: { id: imageId, projectId },
    });
    if (!image) throw new NotFoundException('Image not found');
    return this.prisma.projectImage.update({
      where: { id: imageId },
      data: dto,
    });
  }

  async remove(projectId: string, imageId: string) {
    const image = await this.prisma.projectImage.findFirst({
      where: { id: imageId, projectId },
    });
    if (!image) throw new NotFoundException('Image not found');
    await this.storage.deleteFile(image.s3Key);
    await this.prisma.projectImage.delete({ where: { id: imageId } });
  }

  async reorder(projectId: string, orderedIds: string[]) {
    await this.assertProject(projectId);
    await Promise.all(
      orderedIds.map((id, idx) =>
        this.prisma.projectImage.updateMany({
          where: { id, projectId },
          data: { order: idx },
        }),
      ),
    );
    return this.list(projectId);
  }
}

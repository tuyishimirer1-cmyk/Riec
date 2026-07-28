import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { UpdateServiceImageDto } from './dto/update-service-image.dto';

@Injectable()
export class ServiceImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  private async assertService(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');
  }

  private async findImageOrFail(serviceId: string, imageId: string) {
    const image = await this.prisma.serviceImage.findFirst({
      where: { id: imageId, serviceId },
    });
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async upload(
    serviceId: string,
    files: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    }[],
    captions?: string[],
  ) {
    await this.assertService(serviceId);
    const existing = await this.prisma.serviceImage.count({
      where: { serviceId },
    });

    return Promise.all(
      files.map(async (file, idx) => {
        const s3Key = await this.s3.uploadFile(
          file,
          `services/${serviceId}/images`,
        );
        const url = await this.s3.generateSignedUrl(s3Key);
        return this.prisma.serviceImage.create({
          data: {
            serviceId,
            s3Key,
            url,
            caption: captions?.[idx],
            order: existing + idx,
          },
        });
      }),
    );
  }

  async list(serviceId: string) {
    await this.assertService(serviceId);
    return this.prisma.serviceImage.findMany({
      where: { serviceId },
      orderBy: { order: 'asc' },
    });
  }

  async update(serviceId: string, imageId: string, dto: UpdateServiceImageDto) {
    await this.findImageOrFail(serviceId, imageId);
    return this.prisma.serviceImage.update({
      where: { id: imageId },
      data: dto,
    });
  }

  async reorder(serviceId: string, orderedIds: string[]) {
    await this.assertService(serviceId);
    await Promise.all(
      orderedIds.map((id, idx) =>
        this.prisma.serviceImage.updateMany({
          where: { id, serviceId },
          data: { order: idx },
        }),
      ),
    );
    return this.list(serviceId);
  }

  async remove(serviceId: string, imageId: string) {
    const image = await this.findImageOrFail(serviceId, imageId);
    await this.s3.deleteFileByKey(image.s3Key);
    await this.prisma.serviceImage.delete({ where: { id: imageId } });
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { paginate } from '../common/utils/pagination.util';
import { ProjectDocumentType } from '@prisma/client';
import AdmZip from 'adm-zip';
import axios from 'axios';
import * as mime from 'mime-types';

@Injectable()
export class ProjectAssetsService {
  private readonly logger = new Logger(ProjectAssetsService.name);

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
    
    // For documents/PDFs, we need to get the direct Cloudinary URL without transformations
    const url = await this.cloudinary.generateSignedUrl(asset.s3Key, asset.fileType);
    return { url, filename: asset.filename, fileType: asset.fileType };
  }

  /**
   * Extract and list contents of a ZIP file
   */
  async getZipContents(projectId: string, assetId: string) {
    const asset = await this.findAssetOrFail(projectId, assetId);
    
    if (!asset.fileType.includes('zip')) {
      throw new BadRequestException('Asset is not a ZIP file');
    }

    if (!asset.isDownloadable) {
      throw new ForbiddenException('Asset is not downloadable');
    }

    this.logger.log(`📦 Extracting ZIP contents for asset: ${asset.filename}`);

    try {
      // Get Cloudinary URL and download the ZIP file
      const url = await this.cloudinary.generateSignedUrl(asset.s3Key, asset.fileType);
      
      this.logger.log(`📥 Downloading ZIP from: ${url}`);
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const zipBuffer = Buffer.from(response.data);

      this.logger.log(`✅ ZIP downloaded, size: ${zipBuffer.length} bytes`);

      // Extract ZIP contents
      const zip = new AdmZip(zipBuffer);
      const zipEntries = zip.getEntries();

      const contents = zipEntries
        .filter((entry) => !entry.isDirectory) // Only include files
        .map((entry) => {
          const mimeType = mime.lookup(entry.entryName) || 'application/octet-stream';
          
          return {
            filename: entry.name,
            path: entry.entryName,
            size: entry.header.size,
            isDirectory: entry.isDirectory,
            mimeType,
          };
        });

      this.logger.log(`✅ Extracted ${contents.length} files from ZIP`);

      return {
        zipFilename: asset.filename,
        totalFiles: contents.length,
        totalSize: asset.size,
        contents,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to extract ZIP: ${error.message}`);
      throw new BadRequestException(`Failed to extract ZIP file: ${error.message}`);
    }
  }

  /**
   * Extract and download a specific file from within a ZIP
   */
  async getZipFileContent(projectId: string, assetId: string, filePath: string) {
    const asset = await this.findAssetOrFail(projectId, assetId);
    
    if (!asset.fileType.includes('zip')) {
      throw new BadRequestException('Asset is not a ZIP file');
    }

    if (!asset.isDownloadable) {
      throw new ForbiddenException('Asset is not downloadable');
    }

    this.logger.log(`📄 Extracting file from ZIP: ${filePath}`);

    try {
      // Get Cloudinary URL and download the ZIP file
      const url = await this.cloudinary.generateSignedUrl(asset.s3Key, asset.fileType);
      
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const zipBuffer = Buffer.from(response.data);

      // Extract ZIP contents
      const zip = new AdmZip(zipBuffer);
      const zipEntry = zip.getEntry(filePath);

      if (!zipEntry) {
        throw new NotFoundException(`File not found in ZIP: ${filePath}`);
      }

      if (zipEntry.isDirectory) {
        throw new BadRequestException('Cannot extract a directory');
      }

      // Extract the specific file
      const fileBuffer = zip.readFile(zipEntry);
      
      if (!fileBuffer) {
        throw new BadRequestException('Failed to read file from ZIP');
      }
      
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';

      this.logger.log(`✅ Extracted file: ${filePath}, size: ${fileBuffer.length} bytes`);

      return {
        buffer: fileBuffer,
        filename: zipEntry.name,
        mimeType,
        size: zipEntry.header.size,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`❌ Failed to extract file from ZIP: ${error.message}`);
      throw new BadRequestException(`Failed to extract file from ZIP: ${error.message}`);
    }
  }
}

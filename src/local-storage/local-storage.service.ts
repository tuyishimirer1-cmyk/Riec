import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.publicUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ready: ${this.uploadDir}`);
    } catch (error: any) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  async uploadFile(
    file: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    },
    folder: string,
  ): Promise<string> {
    try {
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
      const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${sanitizedFileName}`;
      const relativePath = path.join(folder, uniqueName);
      const fullPath = path.join(this.uploadDir, relativePath);

      // Create subdirectory if needed
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, file.buffer);

      this.logger.log(`File uploaded: ${relativePath} (${file.size} bytes)`);
      return relativePath.replace(/\\/g, '/'); // Return path with forward slashes
    } catch (error: any) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateSignedUrl(key: string): Promise<string> {
    // For local storage, return public URL
    return `${this.publicUrl}/uploads/${key}`;
  }

  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract path from URL
      const relativePath = url.replace(`${this.publicUrl}/uploads/`, '');
      const fullPath = path.join(this.uploadDir, relativePath);

      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${relativePath}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  async deleteFileByKey(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, key);
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${key}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

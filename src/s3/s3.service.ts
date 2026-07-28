/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);

  private readonly bucket: string;
  private readonly cloudfrontDomain?: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || '';
    this.cloudfrontDomain = this.configService.get<string>(
      'S3_CLOUDFRONT_DOMAIN',
    );

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
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
      const sanitizedFileName = file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        '-',
      );
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${sanitizedFileName}`;
      const key = path.posix.join(folder, uniqueName);

      this.logger.debug(
        `Uploading file to S3: ${key} (${file.size} bytes, ${file.mimetype})`,
      );

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );

      this.logger.log(`File uploaded successfully to S3: ${key}`);
      return key;
    } catch (error: any) {
      this.logger.error(
        `Failed to upload file to S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async generateSignedUrl(key: string): Promise<string> {
    if (this.cloudfrontDomain) {
      return `${this.cloudfrontDomain}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
  }

  async generatePrivateSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 7200 });
  }

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  private extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    if (this.cloudfrontDomain && url.includes(this.cloudfrontDomain)) {
      return url.split(`${this.cloudfrontDomain}/`)[1];
    }

    if (url.includes(`${this.bucket}.s3.amazonaws.com`)) {
      return url.split(`${this.bucket}.s3.amazonaws.com/`)[1];
    }

    return url; // already a key
  }

  async deleteFile(url: string): Promise<boolean> {
    const key = this.extractKeyFromUrl(url);

    if (!key) {
      this.logger.warn(`Unable to extract key from: ${url}`);
      return false;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file: ${key}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to delete ${key}: ${err.message}`);
      return false;
    }
  }

  async deletePropertyImages(imageUrls: string[]): Promise<boolean> {
    const results = await Promise.allSettled(
      imageUrls.map((url) => this.deleteFile(url)),
    );

    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        this.logger.error(
          `Image delete failed: ${imageUrls[idx]} — ${res.reason}`,
        );
      }
    });

    return results.some(
      (res) => res.status === 'fulfilled' && res.value === true,
    );
  }

  generateUniqueKey(
    originalName: string,
    folder?: string,
    category?: string,
  ): string {
    const sanitizedFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '-');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${sanitizedFileName}`;

    if (category) {
      return path.posix.join('documents', category, uniqueName);
    }

    return folder ? path.posix.join(folder, uniqueName) : uniqueName;
  }

  /**
   * Create a folder in S3 (folders are virtual - created by adding an object with key ending in '/')
   */
  async createFolder(folderPath: string): Promise<string> {
    try {
      // Ensure folder path ends with '/'
      const normalizedPath = folderPath.endsWith('/')
        ? folderPath
        : `${folderPath}/`;

      this.logger.debug(`Creating folder in S3: ${normalizedPath}`);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: normalizedPath,
          Body: Buffer.from(''),
          ContentType: 'application/x-directory',
        }),
      );

      this.logger.log(`Folder created successfully in S3: ${normalizedPath}`);
      return normalizedPath;
    } catch (error: any) {
      this.logger.error(
        `Failed to create folder in S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * List files and folders in a given path
   */
  async listFiles(
    folderPath: string,
    maxKeys: number = 1000,
  ): Promise<{
    files: Array<{ key: string; size: number; lastModified: Date }>;
    folders: string[];
  }> {
    try {
      const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

      this.logger.debug(`Listing files in S3 folder: ${prefix}`);

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        Delimiter: '/',
      });

      const response = await this.s3Client.send(command);

      const files = (response.Contents || [])
        .filter((item) => item.Key !== prefix) // Exclude the folder marker itself
        .map((item) => ({
          key: item.Key || '',
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
        }));

      const folders = (response.CommonPrefixes || []).map(
        (prefix) => prefix.Prefix || '',
      );

      this.logger.log(
        `Listed ${files.length} files and ${folders.length} folders in ${prefix}`,
      );
      return { files, folders };
    } catch (error: any) {
      this.logger.error(
        `Failed to list files in S3 folder: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Copy a file from one location to another
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<string> {
    try {
      this.logger.debug(
        `Copying file in S3: ${sourceKey} -> ${destinationKey}`,
      );

      await this.s3Client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        }),
      );

      this.logger.log(
        `File copied successfully: ${sourceKey} -> ${destinationKey}`,
      );
      return destinationKey;
    } catch (error: any) {
      this.logger.error(
        `Failed to copy file in S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Move a file (copy and delete)
   */
  async moveFile(sourceKey: string, destinationKey: string): Promise<string> {
    try {
      this.logger.debug(`Moving file in S3: ${sourceKey} -> ${destinationKey}`);

      // Copy the file
      await this.copyFile(sourceKey, destinationKey);

      // Delete the source file
      await this.deleteFileByKey(sourceKey);

      this.logger.log(
        `File moved successfully: ${sourceKey} -> ${destinationKey}`,
      );
      return destinationKey;
    } catch (error: any) {
      this.logger.error(
        `Failed to move file in S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Rename a file (essentially a move operation)
   */
  async renameFile(
    oldKey: string,
    newFileName: string,
    folderPath?: string,
  ): Promise<string> {
    try {
      const folder = folderPath || path.posix.dirname(oldKey);
      const newKey = path.posix.join(folder, newFileName);

      this.logger.debug(`Renaming file in S3: ${oldKey} -> ${newKey}`);

      return await this.moveFile(oldKey, newKey);
    } catch (error: any) {
      this.logger.error(
        `Failed to rename file in S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete file by key directly
   */
  async deleteFileByKey(key: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting file from S3: ${key}`);

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.log(`File deleted successfully from S3: ${key}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to delete file from S3: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Delete multiple files by keys
   */
  async deleteFiles(keys: string[]): Promise<{
    deleted: string[];
    failed: Array<{ key: string; error: string }>;
  }> {
    try {
      if (!keys || keys.length === 0) {
        this.logger.warn('No keys provided for deletion');
        return { deleted: [], failed: [] };
      }

      this.logger.debug(`Deleting ${keys.length} files from S3`);

      // AWS S3 DeleteObjectsCommand can delete up to 1000 objects at once
      const batchSize = 1000;
      const deleted: string[] = [];
      const failed: Array<{ key: string; error: string }> = [];

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);

        try {
          const command = new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: false,
            },
          });

          const response = await this.s3Client.send(command);

          // Process successful deletions
          if (response.Deleted) {
            response.Deleted.forEach((item) => {
              if (item.Key) {
                deleted.push(item.Key);
              }
            });
          }

          // Process errors
          if (response.Errors) {
            response.Errors.forEach((error) => {
              failed.push({
                key: error.Key || '',
                error: error.Message || 'Unknown error',
              });
            });
          }
        } catch (batchError: any) {
          this.logger.error(`Failed to delete batch: ${batchError.message}`);
          batch.forEach((key) => {
            failed.push({
              key,
              error: batchError.message || 'Unknown error',
            });
          });
        }
      }

      this.logger.log(
        `Deleted ${deleted.length} files, ${failed.length} failed`,
      );
      return { deleted, failed };
    } catch (error: any) {
      this.logger.error(
        `Failed to delete files from S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error: any) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      this.logger.error(
        `Error checking file existence: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a folder and all its contents
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

      this.logger.debug(`Deleting folder from S3: ${prefix}`);

      // List all objects with the folder prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(listCommand);

      if (!response.Contents || response.Contents.length === 0) {
        this.logger.warn(`No objects found in folder: ${prefix}`);
        return true; // Folder is already empty or doesn't exist
      }

      // Delete all objects in the folder
      const keys = response.Contents.map((obj) => obj.Key).filter(
        (key): key is string => !!key,
      );

      if (keys.length > 0) {
        const deleteResult = await this.deleteFiles(keys);
        this.logger.log(
          `Deleted folder ${prefix}: ${deleteResult.deleted.length} files deleted, ${deleteResult.failed.length} failed`,
        );

        if (deleteResult.failed.length > 0) {
          this.logger.warn(
            `Some files failed to delete in folder ${prefix}:`,
            deleteResult.failed,
          );
        }
      }

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to delete folder from S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType?: string;
    lastModified: Date;
    etag?: string;
  }> {
    try {
      this.logger.debug(`Getting file metadata for: ${key}`);

      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType,
        lastModified: response.LastModified || new Date(),
        etag: response.ETag,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get file metadata: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

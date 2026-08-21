import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error('❌ Cloudinary credentials not found in environment!');
      this.logger.error('Cloud Name: ' + (cloudName || 'MISSING'));
      this.logger.error('API Key: ' + (apiKey ? 'SET' : 'MISSING'));
      this.logger.error('API Secret: ' + (apiSecret ? 'SET' : 'MISSING'));
      return;
    }

    try {
      // Configure Cloudinary with explicit values
      const config = {
        cloud_name: String(cloudName).trim(),
        api_key: String(apiKey).trim(),
        api_secret: String(apiSecret).trim(),
        secure: true,
      };

      cloudinary.config(config);

      this.logger.log(`✅ Cloudinary initialized successfully!`);
      this.logger.log(`   Cloud: ${config.cloud_name}`);
      this.logger.log(`   API Key: ${config.api_key.substring(0, 6)}...`);
    } catch (error: any) {
      this.logger.error(`❌ Cloudinary config failed: ${error.message}`);
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
  ): Promise<{ publicId: string; url: string; secureUrl: string }> {
    try {
      const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
      const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
      const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Cloudinary credentials not configured');
      }

      this.logger.log(`📤 Uploading to Cloudinary...`);
      this.logger.log(`   Cloud: ${cloudName}`);
      this.logger.log(`   File: ${file.originalname} (${file.size} bytes)`);
      this.logger.log(`   Folder: ${folder}`);

      // IMPORTANT: Re-configure cloudinary before EACH upload
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      // Convert buffer to base64 data URI
      const b64 = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Use cloudinary SDK upload method with public access
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: folder,
        resource_type: 'auto',
        access_mode: 'public',
        type: 'upload',
      });

      this.logger.log(`✅ Upload SUCCESS!`);
      this.logger.log(`   Public ID: ${result.public_id}`);
      this.logger.log(`   Secure URL: ${result.secure_url}`);
      this.logger.log(`   Asset ID: ${result.asset_id}`);
      this.logger.log(`   Created: ${result.created_at}`);

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
      };
    } catch (error: any) {
      this.logger.error(`❌ Upload FAILED!`);
      this.logger.error(`   File: ${file.originalname}`);
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(`   HTTP Code: ${error.http_code || 'N/A'}`);
      this.logger.error(`   Full error: ${JSON.stringify(error)}`);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted: ${publicId}`);
      return result.result === 'ok';
    } catch (error: any) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  async generateSignedUrl(publicId: string): Promise<string> {
    try {
      // Check if this is a PDF or document (don't transform documents!)
      const isPdf = publicId.toLowerCase().endsWith('.pdf') || 
                    publicId.toLowerCase().includes('/documents/');
      
      if (isPdf) {
        // For PDFs and documents: Return raw file URL without any transformations
        // This preserves all pages in the PDF
        return cloudinary.url(publicId, {
          secure: true,
          resource_type: 'raw',  // Use 'raw' for documents to prevent image conversion
          type: 'upload',
        });
      }
      
      // For images only: Apply optimization transformations
      return cloudinary.url(publicId, {
        secure: true,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });
    } catch (error: any) {
      this.logger.error(`Failed to generate URL: ${error.message}`);
      throw error;
    }
  }

  async fileExists(publicId: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(publicId);
      return true;
    } catch {
      return false;
    }
  }
}

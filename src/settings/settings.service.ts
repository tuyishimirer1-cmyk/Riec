import { Injectable } from '@nestjs/common';
import { UpdateSocialLinksDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private settings = {
    siteName: 'RIEC',
    siteUrl:
      process.env.FRONTEND_ORIGIN || 'https://riec-frontend.onrender.com',
    tagline: 'Real Estate Development',
    description: 'RIEC - Real Estate Development Company',
    pages: ['about', 'services', 'projects', 'contact'],
  };

  private socialLinks: UpdateSocialLinksDto = {
    facebook: null,
    twitter: null,
    linkedin: null,
    instagram: null,
    youtube: null,
  };

  getSettings() {
    return {
      statusCode: 200,
      message: 'Settings retrieved successfully',
      data: this.settings,
    };
  }

  updateSettings(dto: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...dto };
    return {
      statusCode: 200,
      message: 'Settings updated successfully',
      data: this.settings,
    };
  }

  getSocialLinks() {
    return {
      statusCode: 200,
      message: 'Social links retrieved successfully',
      data: this.socialLinks,
    };
  }

  updateSocialLinks(dto: UpdateSocialLinksDto) {
    this.socialLinks = {
      facebook: dto.facebook ?? null,
      twitter: dto.twitter ?? null,
      linkedin: dto.linkedin ?? null,
      instagram: dto.instagram ?? null,
      youtube: dto.youtube ?? null,
    };
    return {
      statusCode: 200,
      message: 'Social links updated successfully',
      data: this.socialLinks,
    };
  }

  getSiteInfo() {
    return {
      statusCode: 200,
      message: 'Site info retrieved successfully',
      data: {
        name: this.settings.siteName,
        url: this.settings.siteUrl,
        tagline: this.settings.tagline,
        description: this.settings.description,
      },
    };
  }
}

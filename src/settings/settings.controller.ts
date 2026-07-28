import { Controller, Get, Put, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { SettingsService } from './settings.service';
import {
  UpdateSettingsDto,
  UpdateSocialLinksDto,
} from './dto/update-settings.dto';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get site settings',
    description:
      'Retrieve site configuration and metadata. Requires admin authentication.',
  })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @ApiOperation({
    summary: 'Update site settings',
    description:
      'Update site name, URL, tagline, description, and available pages. Requires admin authentication.',
  })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Get('social')
  @ApiOperation({
    summary: 'Get social media links',
    description:
      'Retrieve all configured social media links. Requires admin authentication.',
  })
  getSocialLinks() {
    return this.settingsService.getSocialLinks();
  }

  @Patch('social')
  @ApiOperation({
    summary: 'Update social media links',
    description:
      'Update social media links for Facebook, Twitter, LinkedIn, Instagram, and YouTube. Requires admin authentication.',
  })
  updateSocialLinks(@Body() dto: UpdateSocialLinksDto) {
    return this.settingsService.updateSocialLinks(dto);
  }

  @Get('site')
  @ApiOperation({
    summary: 'Get site metadata',
    description:
      'Retrieve site metadata including name, URL, and description. Requires admin authentication.',
  })
  getSiteInfo() {
    return this.settingsService.getSiteInfo();
  }
}

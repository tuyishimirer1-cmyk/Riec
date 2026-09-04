import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { PropertyInquiryDto, PropertyViewingDto } from './dto/property-inquiry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all verified properties (public)' })
  @ApiResponse({ status: 200, description: 'Returns paginated properties list' })
  findAll(@Query() filterDto: FilterPropertyDto) {
    return this.propertiesService.findAll(filterDto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured properties' })
  @ApiResponse({ status: 200, description: 'Returns featured properties' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findFeatured(@Query('limit') limit?: number) {
    return this.propertiesService.findFeatured(limit ? Number(limit) : 8);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get properties statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  getStats() {
    return this.propertiesService.getStats();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get property details by slug' })
  @ApiParam({ name: 'slug', example: 'modern-4-bedroom-house-kicukiro' })
  @ApiResponse({ status: 200, description: 'Returns property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  findOne(@Param('slug') slug: string) {
    return this.propertiesService.findOneBySlug(slug);
  }

  @Post(':id/inquiry')
  @ApiOperation({ summary: 'Submit inquiry for a property (contact seller)' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Inquiry submitted successfully' })
  createInquiry(
    @Param('id') id: string,
    @Body() inquiryDto: PropertyInquiryDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    return this.propertiesService.createInquiry(id, inquiryDto, userId);
  }

  @Post(':id/viewing')
  @ApiOperation({ summary: 'Request property viewing' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Viewing request submitted successfully' })
  createViewing(
    @Param('id') id: string,
    @Body() viewingDto: PropertyViewingDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    return this.propertiesService.createViewing(id, viewingDto, userId);
  }

  // ==================== AUTHENTICATED USER ENDPOINTS ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new property (authenticated)' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: any) {
    return this.propertiesService.create(createPropertyDto, req.user.userId);
  }

  @Get('my/properties')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my properties' })
  @ApiResponse({ status: 200, description: 'Returns user properties' })
  findMyProperties(@Request() req: any) {
    return this.propertiesService.findMyProperties(req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own property' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not property owner' })
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own property' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not property owner' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.remove(id, req.user.userId);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle property favorite' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Favorite toggled successfully' })
  toggleFavorite(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.toggleFavorite(id, req.user.userId);
  }

  @Get('my/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my favorite properties' })
  @ApiResponse({ status: 200, description: 'Returns favorite properties' })
  findFavorites(@Request() req: any) {
    return this.propertiesService.findFavorites(req.user.userId);
  }
}

// ==================== ADMIN CONTROLLER ====================

@ApiTags('Admin - Properties')
@Controller('admin/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all properties (admin)' })
  @ApiResponse({ status: 200, description: 'Returns all properties' })
  findAll(@Query() filterDto: FilterPropertyDto) {
    return this.propertiesService.findAllAdmin(filterDto);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending verification properties' })
  @ApiResponse({ status: 200, description: 'Returns pending properties' })
  findPending() {
    return this.propertiesService.findPendingVerification();
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify property' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Property verified successfully' })
  verify(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.verifyProperty(id, req.user.userId);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject property' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Property rejected successfully' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.propertiesService.rejectProperty(id, reason);
  }

  @Put(':id/feature')
  @ApiOperation({ summary: 'Toggle property featured status' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Featured status toggled' })
  toggleFeatured(@Param('id') id: string, @Body('featuredUntil') featuredUntil?: string) {
    const date = featuredUntil ? new Date(featuredUntil) : undefined;
    return this.propertiesService.toggleFeatured(id, date);
  }

  @Get('inquiries')
  @ApiOperation({ summary: 'Get all property inquiries' })
  @ApiResponse({ status: 200, description: 'Returns all inquiries' })
  findAllInquiries() {
    return this.propertiesService.findAllInquiries();
  }

  @Get('viewings')
  @ApiOperation({ summary: 'Get all viewing requests' })
  @ApiResponse({ status: 200, description: 'Returns all viewings' })
  findAllViewings() {
    return this.propertiesService.findAllViewings();
  }

  @Put('viewings/:id')
  @ApiOperation({ summary: 'Update viewing status' })
  @ApiParam({ name: 'id', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Viewing status updated' })
  updateViewing(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED' | 'COMPLETED',
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.propertiesService.updateViewingStatus(id, status, adminNotes);
  }
}

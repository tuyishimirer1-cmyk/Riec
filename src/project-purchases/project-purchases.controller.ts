import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProjectPurchasesService } from './project-purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { PurchaseStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Project Purchases Endpoints')
@Controller('projects/:projectId/purchases')
export class ProjectPurchasesController {
  constructor(private readonly service: ProjectPurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Record a purchase for a project tier' })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiCreatedResponse({ description: 'Purchase recorded.' })
  @ApiNotFoundResponse({ description: 'Project or tier not found.' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.service.create(projectId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List purchases for a project (admin)' })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ description: 'Paginated list of purchases.' })
  list(
    @Param('projectId') projectId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.list(projectId, Number(page), Number(limit));
  }

  @Get(':purchaseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single purchase (admin)' })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiParam({ name: 'purchaseId', example: '65f34e7e0a2b3c4d5e6f7895' })
  @ApiOkResponse({ description: 'Purchase details.' })
  @ApiNotFoundResponse({ description: 'Purchase not found.' })
  findOne(
    @Param('projectId') projectId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.service.findOne(projectId, purchaseId);
  }

  @Put(':purchaseId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update purchase status (admin)' })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiParam({ name: 'purchaseId', example: '65f34e7e0a2b3c4d5e6f7895' })
  @ApiOkResponse({ description: 'Purchase status updated.' })
  @ApiNotFoundResponse({ description: 'Purchase not found.' })
  updateStatus(
    @Param('projectId') projectId: string,
    @Param('purchaseId') purchaseId: string,
    @Body('status') status: PurchaseStatus,
  ) {
    return this.service.updateStatus(projectId, purchaseId, status);
  }

  @Get(':purchaseId/downloads')
  @ApiOperation({
    summary: 'Get signed download URLs for assets in a completed purchase',
  })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiParam({ name: 'purchaseId', example: '65f34e7e0a2b3c4d5e6f7895' })
  @ApiOkResponse({ description: 'Signed download URLs for purchased assets.' })
  @ApiNotFoundResponse({ description: 'Purchase not found.' })
  getDownloadLinks(
    @Param('projectId') projectId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.service.getDownloadLinks(projectId, purchaseId);
  }

  @Post(':purchaseId/download-token')
  @ApiOperation({
    summary: 'Generate a one-time download token for a completed purchase',
  })
  @ApiParam({ name: 'projectId', example: '65f34e7e0a2b3c4d5e6f7890' })
  @ApiParam({ name: 'purchaseId', example: '65f34e7e0a2b3c4d5e6f7895' })
  @ApiOkResponse({ description: 'Download token generated.' })
  generateDownloadToken(
    @Param('projectId') projectId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.service.generateDownloadToken(projectId, purchaseId);
  }
}

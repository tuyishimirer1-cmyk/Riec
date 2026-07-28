import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ProjectPricingTiersService } from './project-pricing-tiers.service';
import { CreatePriceTierDto } from './dto/create-price-tier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('Project Pricing Tiers Endpoints')
@Controller('projects/:projectId/tiers')
export class ProjectPricingTiersController {
  constructor(private readonly service: ProjectPricingTiersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Pricing tier created successfully')
  @ApiOperation({
    summary: 'Create a pricing tier for a project',
    description:
      'Create a pricing tier (package) for a project. Pricing tiers define what assets/documents are included at each price point. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiCreatedResponse({
    description: 'Pricing tier created successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7892',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Basic Package',
        description: 'Includes site plan and architectural drawings',
        currency: 'NGN',
        amount: 150000,
        isActive: true,
        assets: [],
      },
    },
  })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreatePriceTierDto,
  ) {
    return this.service.create(projectId, dto);
  }

  @Get()
  @ResponseMessage('Pricing tiers retrieved successfully')
  @ApiOperation({
    summary: 'List pricing tiers for a project',
    description:
      'Retrieve all pricing tiers for a project. Use onlyActive=true to get only active tiers. Pricing tiers include linked asset information.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiQuery({
    name: 'onlyActive',
    required: false,
    description: 'Filter to only include active tiers - use "true"',
  })
  @ApiOkResponse({
    description: 'List of pricing tiers with their linked assets',
    schema: {
      example: {
        data: [
          {
            id: 'tier1',
            projectId: '65f34e7e0a2b3c4d5e6f7890',
            name: 'Basic Package',
            description: 'Includes site plan and architectural drawings',
            currency: 'NGN',
            amount: 150000,
            isActive: true,
            assets: [
              {
                id: 'asset1',
                filename: 'site-plan.pdf',
                fileType: 'application/pdf',
                size: 2048576,
              },
            ],
          },
        ],
      },
    },
  })
  list(
    @Param('projectId') projectId: string,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.service.list(projectId, onlyActive === 'true');
  }

  @Get(':tierId')
  @ResponseMessage('Pricing tier retrieved successfully')
  @ApiOperation({
    summary: 'Get a single pricing tier',
    description:
      'Retrieve details of a specific pricing tier including linked assets.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'tierId',
    description: 'MongoDB ObjectId of the pricing tier',
    example: '65f34e7e0a2b3c4d5e6f7892',
  })
  @ApiOkResponse({
    description: 'Pricing tier details',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7892',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Basic Package',
        description: 'Includes site plan and architectural drawings',
        currency: 'NGN',
        amount: 150000,
        isActive: true,
        createdAt: '2024-01-15T10:30:00Z',
        assets: [
          {
            id: 'asset1',
            filename: 'site-plan.pdf',
            fileType: 'application/pdf',
            size: 2048576,
            downloadUrl: null,
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Pricing tier not found or does not belong to the project',
  })
  findOne(
    @Param('projectId') projectId: string,
    @Param('tierId') tierId: string,
  ) {
    return this.service.findOne(projectId, tierId);
  }

  @Put(':tierId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Pricing tier updated successfully')
  @ApiOperation({
    summary: 'Update a pricing tier',
    description:
      'Update pricing tier details including name, description, price, currency, and active status. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'tierId',
    description: 'MongoDB ObjectId of the pricing tier',
    example: '65f34e7e0a2b3c4d5e6f7892',
  })
  @ApiOkResponse({
    description: 'Pricing tier updated successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7892',
        projectId: '65f34e7e0a2b3c4d5e6f7890',
        name: 'Updated Package Name',
        description: 'Updated description',
        currency: 'NGN',
        amount: 200000,
        isActive: true,
        updatedAt: '2024-01-16T14:20:00Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Pricing tier not found or does not belong to the project',
  })
  update(
    @Param('projectId') projectId: string,
    @Param('tierId') tierId: string,
    @Body() dto: CreatePriceTierDto,
  ) {
    return this.service.update(projectId, tierId, dto);
  }

  @Delete(':tierId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Pricing tier deleted successfully')
  @ApiOperation({
    summary: 'Delete a pricing tier',
    description:
      'Permanently delete a pricing tier. This will not delete associated assets, but they will no longer be accessible through this tier. Requires admin authentication.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'MongoDB ObjectId of the project',
    example: '65f34e7e0a2b3c4d5e6f7890',
  })
  @ApiParam({
    name: 'tierId',
    description: 'MongoDB ObjectId of the pricing tier',
    example: '65f34e7e0a2b3c4d5e6f7892',
  })
  @ApiOkResponse({
    description: 'Pricing tier deleted successfully',
    schema: {
      example: { message: 'Pricing tier deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Pricing tier not found or does not belong to the project',
  })
  remove(
    @Param('projectId') projectId: string,
    @Param('tierId') tierId: string,
  ) {
    return this.service.remove(projectId, tierId);
  }
}

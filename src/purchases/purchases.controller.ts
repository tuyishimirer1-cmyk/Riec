import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPurchasesService } from '../project-purchases/project-purchases.service';

@ApiTags('Purchases Endpoints')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: ProjectPurchasesService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'View purchase history (client users)',
    description:
      'Retrieve a paginated list of purchases made by the authenticated user. Requires authentication. Returns purchases across all projects.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    description:
      'Paginated list of user purchases with project and tier details',
    schema: {
      example: {
        data: [
          {
            id: 'purchase1',
            project: {
              id: 'project1',
              title: 'Modern Family Villa',
              slug: 'modern-family-villa',
            },
            tier: {
              id: 'tier1',
              name: 'Basic Package',
              currency: 'NGN',
              amount: 150000,
            },
            status: 'COMPLETED',
            fullName: 'John Doe',
            email: 'customer@example.com',
            createdAt: '2024-01-15T14:30:00Z',
          },
        ],
        total: 5,
        meta: {
          total: 5,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  async getMyPurchases(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const user = req.user as { email: string };
    return this.purchasesService.getMyPurchases(user.email, page, limit);
  }
}

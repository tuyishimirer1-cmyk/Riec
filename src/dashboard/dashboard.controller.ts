import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get dashboard overview statistics',
    description:
      'Returns combined statistics for projects, services, careers, applications, and users. Requires admin authentication.',
  })
  @ApiQuery({ name: 'period', required: false, example: '30d' })
  @ApiOperation({ description: 'Time period: 7d, 30d, 90d, 1y, all' })
  async getDashboardStats(@Query('period') period: string = '30d') {
    return this.dashboardService.getOverviewStats(period);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description:
      'Returns revenue statistics including total sales, revenue by project, and payment trends. Requires admin authentication.',
  })
  @ApiQuery({ name: 'period', required: false, example: '30d' })
  async getRevenueStats(@Query('period') period: string = '30d') {
    return this.dashboardService.getRevenueStats(period);
  }
}

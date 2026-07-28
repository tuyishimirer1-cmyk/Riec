import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats(period: string) {
    const days = this.parsePeriod(period);
    const dateFilter = days
      ? { createdAt: { gte: this.getDateDaysAgo(days) } }
      : {};

    const [projects, services, jobs, jobApplications, users, purchases] =
      await Promise.all([
        this.prisma.project.count({ where: dateFilter }),
        this.prisma.service.count(),
        this.prisma.job.count({ where: dateFilter }),
        this.prisma.jobApplication.count({ where: dateFilter }),
        this.prisma.user.count(),
        this.prisma.purchase.count({ where: dateFilter }),
      ]);

    const publishedProjects = await this.prisma.project.count({
      where: { ...dateFilter, isPublished: true },
    });

    const pendingApplications = await this.prisma.jobApplication.count({
      where: { status: 'NEW' },
    });

    const unreadSubmissions = await this.prisma.contactSubmission.count({
      where: { read: false },
    });

    return {
      overview: {
        projects,
        publishedProjects,
        services,
        jobs,
        jobApplications,
        pendingApplications,
        users,
        purchases,
        unreadSubmissions,
      },
      period,
    };
  }

  async getRevenueStats(period: string) {
    const days = this.parsePeriod(period);
    const dateFilter = days
      ? { createdAt: { gte: this.getDateDaysAgo(days) } }
      : {};

    const purchases = await this.prisma.purchase.findMany({
      where: dateFilter,
      include: { project: { select: { title: true } } },
    });

    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPurchases = purchases.length;

    const revenueByProject = await this.prisma.purchase.groupBy({
      by: ['projectId'],
      where: dateFilter,
      _sum: { amount: true },
    });

    const projectTitles = await this.prisma.project.findMany({
      where: { id: { in: revenueByProject.map((r) => r.projectId) } },
      select: { id: true, title: true },
    });

    const projectTitleMap = new Map(projectTitles.map((p) => [p.id, p.title]));

    const revenueByProjectWithTitles = revenueByProject.map((r) => ({
      projectId: r.projectId,
      projectTitle: projectTitleMap.get(r.projectId) || 'Unknown',
      revenue: r._sum.amount || 0,
    }));

    return {
      totalRevenue,
      totalPurchases,
      period,
      byProject: revenueByProjectWithTitles,
    };
  }

  private parsePeriod(period: string): number | null {
    const map: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    return map[period] || null;
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}

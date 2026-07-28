import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async health() {
    let db = 'ok';
    try {
      // Check connectivity using ContactSubmission collection (no updatedAt field)
      await this.prisma.contactSubmission.count();
    } catch (error) {
      db = 'error';
      console.error('Health check database error:', error);
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

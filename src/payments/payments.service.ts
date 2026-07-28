import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(private readonly prisma: PrismaService) {}

  private get authHeader() {
    return { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` };
  }

  async initProjectCheckout(input: {
    projectId: string;
    tierId: string;
    email: string;
    fullName: string;
  }) {
    // Allow either a Mongo ObjectId or a project slug to be passed as projectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(input.projectId);
    const project = await this.prisma.project.findUnique({
      where: isObjectId ? { id: input.projectId } : { slug: input.projectId },
      include: { pricingTiers: true },
    });
    if (!project || !project.purchasable) {
      throw new BadRequestException('Project not purchasable');
    }

    const tier = project.pricingTiers.find(
      (t) => t.id === input.tierId && t.isActive,
    );
    if (!tier) {
      throw new BadRequestException('Invalid tier');
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        projectId: project.id,
        tierId: tier.id,
        email: input.email,
        fullName: input.fullName,
        amount: tier.amount,
        currency: tier.currency,
        flutterwaveRef: '',
      },
    });

    const txRef = `RIEC-${purchase.id}-${Date.now()}`;

    const res = await axios.post(
      `${this.baseUrl}/payments`,
      {
        tx_ref: txRef,
        amount: tier.amount,
        currency: tier.currency,
        redirect_url: `${process.env.FRONTEND_BASE_URL}/payment/result`,
        customer: {
          email: input.email,
          name: input.fullName,
        },
        meta: {
          purchaseId: purchase.id,
          projectId: project.id,
          tierId: tier.id,
        },
      },
      { headers: this.authHeader },
    );

    await this.prisma.purchase.update({
      where: { id: purchase.id },
      data: { flutterwaveRef: txRef },
    });

    return { link: res.data.data.link };
  }

  async handleWebhook(body: any) {
    // TODO: verify signature via FLW_WEBHOOK_SECRET and headers
    const { tx_ref, status } = body.data;

    const purchase = await this.prisma.purchase.findFirst({
      where: { flutterwaveRef: tx_ref },
    });
    if (!purchase) return;

    if (status === 'successful') {
      const token = randomBytes(24).toString('hex');
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'SUCCESS', downloadToken: token },
      });
    } else {
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'FAILED' },
      });
    }
  }

  async getDownloadsByToken(token: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { downloadToken: token, status: 'SUCCESS' },
      include: {
        project: {
          include: { assets: true },
        },
        tier: true,
      },
    });
    if (!purchase) {
      throw new BadRequestException('Invalid token');
    }

    return purchase.project.assets.filter(
      (a) => !a.tierId || a.tierId === purchase.tierId,
    );
  }
}

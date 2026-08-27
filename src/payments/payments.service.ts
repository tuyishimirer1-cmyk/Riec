import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../contact/email.service';

@Injectable()
export class PaymentsService {
  private readonly rwandapayBaseUrl = 'https://api.rwandapay.rw/v1';
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async initProjectCheckout(input: {
    projectId: string;
    tierId?: string;
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

    let amount: number;
    let currency: string;
    let tierId: string | null = null;

    // If tierId is provided, use the pricing tier
    if (input.tierId && input.tierId !== 'default') {
      const tier = project.pricingTiers.find(
        (t) => t.id === input.tierId && t.isActive,
      );
      if (!tier) {
        throw new BadRequestException('Invalid tier');
      }
      amount = tier.amount;
      currency = tier.currency;
      tierId = tier.id;
    } else {
      // Use project basePrice if no tier specified
      if (!project.basePrice) {
        throw new BadRequestException(
          'Project has no base price or pricing tiers',
        );
      }
      amount = project.basePrice;
      currency = project.currency || 'RWF';
      tierId = null;
    }

    // RwandaPay supports RWF, convert if needed
    if (currency !== 'RWF') {
      amount = currency === 'USD' ? amount * 1300 : amount;
      currency = 'RWF';
    }

    const purchase = await this.prisma.purchase.create({
      data: {
        projectId: project.id,
        tierId: tierId,
        email: input.email,
        fullName: input.fullName,
        amount: amount,
        currency: currency,
        flutterwaveRef: '', // Will be updated with RwandaPay ref
      },
    });

    const txRef = `RIEC-${purchase.id}-${Date.now()}`;

    // CHECK FOR TEST MODE
    const isTestMode = process.env.PAYMENT_MODE === 'test';

    if (isTestMode) {
      console.log('🧪 TEST MODE: Simulating payment...');
      console.log(`   Purchase ID: ${purchase.id}`);
      console.log(`   Amount: ${amount} ${currency}`);
      console.log(`   Customer: ${input.fullName} (${input.email})`);
      
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { flutterwaveRef: txRef },
      });

      const token = randomBytes(24).toString('hex');
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { 
          status: 'SUCCESS',
          downloadToken: token,
        },
      });

      console.log('✅ TEST MODE: Payment simulated successfully!');
      console.log(`   Download Token: ${token}`);

      // Send confirmation email
      console.log('📧 Sending purchase confirmation email...');
      try {
        await this.emailService.sendProjectPurchaseEmail({
          to: input.email,
          customerName: input.fullName,
          projectName: project.title,
          projectDescription: project.description || undefined,
          downloadToken: token,
          transactionId: purchase.id,
          amount: `${amount.toLocaleString()} ${currency}`,
        });
        console.log('✅ Confirmation email sent successfully!');
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
      }

      return { 
        link: `${process.env.FRONTEND_BASE_URL}/payment/result?status=success&tx_ref=${txRef}&transaction_id=${purchase.id}&token=${token}`,
        ref: txRef,
        testMode: true,
        token: token,
      };
    }

    // PRODUCTION MODE: Use RwandaPay API
    try {
      console.log('💳 Initializing RwandaPay payment...');
      console.log(`   Amount: ${amount} ${currency}`);
      console.log(`   Customer: ${input.fullName}`);

      const rwandapayResponse = await axios.post(
        `${this.rwandapayBaseUrl}/payments`,
        {
          amount: Math.round(amount),
          currency: currency,
          reference: txRef,
          customer: {
            email: input.email,
            name: input.fullName,
          },
          metadata: {
            purchase_id: purchase.id,
            project_name: project.title,
          },
          callback_url: `${process.env.FRONTEND_BASE_URL}/payment/result`,
          webhook_url: `${process.env.BACKEND_URL}/api/payments/webhook/rwandapay`,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RWANDAPAY_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { flutterwaveRef: txRef },
      });

      const paymentLink = rwandapayResponse.data?.data?.payment_url || 
                         rwandapayResponse.data?.payment_url ||
                         rwandapayResponse.data?.checkout_url;

      console.log('✅ RwandaPay payment initialized successfully!');
      return { link: paymentLink, ref: txRef };
    } catch (error: any) {
      console.error('❌ RwandaPay API error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Payment initialization failed',
      );
    }
  }

  async handleWebhook(body: any) {
    try {
      console.log('📨 RwandaPay webhook received:', JSON.stringify(body, null, 2));

      const { reference, status, metadata } = body;

      if (!reference && !metadata?.purchase_id) {
        console.error('❌ Invalid webhook: missing reference or purchase_id');
        return { message: 'Invalid webhook data' };
      }

      const purchase = await this.prisma.purchase.findFirst({
        where: {
          OR: [
            { flutterwaveRef: reference },
            { id: metadata?.purchase_id },
          ],
        },
      });

      if (!purchase) {
        console.error(`❌ Purchase not found for ref: ${reference}`);
        return { message: 'Purchase not found' };
      }

      console.log(`✅ Found purchase: ${purchase.id}, current status: ${purchase.status}`);

      if (status === 'success' || status === 'completed' || status === 'paid') {
        const token = randomBytes(24).toString('hex');
        await this.prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'SUCCESS', downloadToken: token },
        });
        console.log(`✅ Purchase ${purchase.id} marked as SUCCESS with token: ${token}`);

        const purchaseWithProject = await this.prisma.purchase.findUnique({
          where: { id: purchase.id },
          include: { project: true },
        });

        if (purchaseWithProject && purchaseWithProject.project) {
          console.log('📧 Sending purchase confirmation email...');
          try {
            await this.emailService.sendProjectPurchaseEmail({
              to: purchase.email,
              customerName: purchase.fullName,
              projectName: purchaseWithProject.project.title,
              projectDescription: purchaseWithProject.project.description || undefined,
              downloadToken: token,
              transactionId: purchase.id,
              amount: `${purchase.amount.toLocaleString()} ${purchase.currency}`,
            });
            console.log('✅ Confirmation email sent successfully!');
          } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
          }
        }
      } else if (status === 'failed' || status === 'failure' || status === 'cancelled') {
        await this.prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'FAILED' },
        });
        console.log(`❌ Purchase ${purchase.id} marked as FAILED`);
      } else {
        console.log(`⏳ Purchase ${purchase.id} status: ${status} (pending)`);
      }

      return { message: 'Webhook processed successfully' };
    } catch (error: any) {
      console.error('❌ Webhook processing error:', error.message);
      return { message: 'Webhook processing failed', error: error.message };
    }
  }

  async getDownloadsByToken(token: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { downloadToken: token, status: 'SUCCESS' },
      include: {
        project: {
          include: { assets: true },
        },
        tier: { include: { assets: true } },
      },
    });
    if (!purchase) {
      throw new BadRequestException('Invalid token');
    }

    if (purchase.tier) {
      return purchase.project.assets.filter(
        (a) => !a.tierId || a.tierId === purchase.tierId,
      );
    } else {
      return purchase.project.assets;
    }
  }
}

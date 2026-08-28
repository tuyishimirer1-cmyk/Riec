import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomBytes, randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../contact/email.service';

@Injectable()
export class PaymentsService {
  private readonly rwandapayBaseUrl = 'https://pay.rwandapay.rw/api/v1';
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async initProjectCheckout(input: {
    projectId: string;
    tierId?: string;
    email: string;
    fullName: string;
    phone: string;
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

    // RwandaPay minimum is 100 RWF
    if (amount < 100) {
      throw new BadRequestException('Payment amount must be at least 100 RWF');
    }

    if (amount > 1_000_000) {
      throw new BadRequestException('Payment amount cannot exceed 1,000,000 RWF');
    }

    // Normalize Rwanda phone number
    const phone = this.normalizeRwandaPhone(input.phone);

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
      console.log(`   Phone: ${phone}`);
      
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
    const publicKey = process.env.RWANDAPAY_PUBLIC_KEY;
    const secretKey = process.env.RWANDAPAY_SECRET_KEY;

    if (!publicKey || !secretKey) {
      throw new BadRequestException('RwandaPay API keys are not configured');
    }

    try {
      console.log('💳 Initializing RwandaPay checkout...');
      console.log(`   Amount: ${amount} ${currency}`);
      console.log(`   Customer: ${input.fullName}`);
      console.log(`   Phone: ${phone}`);

      const idempotencyKey = randomUUID();

      const response = await axios.post(
        `${this.rwandapayBaseUrl}/checkout/initialize`,
        {
          amount: Math.round(amount),
          currency: 'RWF',
          tx_ref: txRef,
          customer: {
            name: input.fullName,
            phone: phone,
            email: input.email,
          },
          description: `Purchase: ${project.title}`,
          redirect_url: `${process.env.FRONTEND_BASE_URL}/payment/result`,
          webhook_url: `${process.env.BACKEND_URL}/api/payments/webhook/rwandapay`,
          meta: {
            purchase_id: purchase.id,
            project_id: project.id,
            project_name: project.title,
          },
        },
        {
          headers: {
            'X-Public-Key': publicKey,
            'X-Secret-Key': secretKey,
            'Idempotency-Key': idempotencyKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        },
      );

      const data = response.data;

      console.log('RwandaPay response:', JSON.stringify(data, null, 2));

      if (!data?.success || !data?.data?.payment_url) {
        console.error('❌ RwandaPay did not return payment_url', data);
        throw new BadRequestException(
          data?.error?.message || data?.message || 'RwandaPay did not return a payment URL',
        );
      }

      const rwandaPayReference = data.data.reference || txRef;

      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { flutterwaveRef: rwandaPayReference },
      });

      console.log('✅ RwandaPay checkout initialized');
      console.log(`   Reference: ${rwandaPayReference}`);
      console.log(`   Payment URL: ${data.data.payment_url}`);

      return { 
        link: data.data.payment_url, 
        ref: rwandaPayReference,
        purchaseId: purchase.id,
      };
    } catch (error: any) {
      console.error('❌ RwandaPay API error:', error.response?.data || error.message);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        error.message ||
        'Payment initialization failed',
      );
    }
  }

  async handleWebhook(body: any, rawBody?: Buffer, signature?: string) {
    try {
      console.log('📨 RwandaPay webhook received:', JSON.stringify(body, null, 2));

      // Verify webhook signature
      const webhookSecret = process.env.RWANDAPAY_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('❌ RWANDAPAY_WEBHOOK_SECRET is not configured');
        return { message: 'Webhook secret not configured' };
      }

      if (signature && rawBody) {
        try {
          const expectedSignature = createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('base64');

          const received = Buffer.from(signature.trim());
          const expected = Buffer.from(expectedSignature);

          if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
            console.error('❌ Invalid RwandaPay webhook signature');
            return { message: 'Invalid webhook signature' };
          }

          console.log('✅ RwandaPay webhook signature verified');
        } catch (verifyError) {
          console.error('❌ Signature verification error:', verifyError);
          return { message: 'Signature verification failed' };
        }
      } else {
        console.warn('⚠️ Webhook signature not provided - skipping verification');
      }

      const eventKind = body?.event_kind;
      const status = body?.status;
      const paypackReference = body?.paypack_reference || body?.reference || body?.tx_ref;

      if (!paypackReference) {
        console.error('❌ Webhook missing payment reference');
        return { message: 'Missing payment reference' };
      }

      const purchase = await this.prisma.purchase.findFirst({
        where: {
          flutterwaveRef: paypackReference,
        },
      });

      if (!purchase) {
        console.error(`❌ Purchase not found for reference: ${paypackReference}`);
        return { message: 'Purchase not found' };
      }

      console.log(`✅ Found purchase: ${purchase.id}, current status: ${purchase.status}`);

      // Avoid processing the same successful webhook twice
      if (purchase.status === 'SUCCESS') {
        console.log(`ℹ️ Purchase ${purchase.id} already processed`);
        return { message: 'Webhook already processed' };
      }

      if (
        eventKind === 'transaction:processed' ||
        eventKind === 'payment.successful' ||
        status === 'successful' ||
        status === 'success' ||
        status === 'completed' ||
        status === 'paid'
      ) {
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

  private normalizeRwandaPhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/[-()]/g, '');

    // Format: 07XXXXXXXX
    if (/^07\d{8}$/.test(cleaned)) {
      return cleaned;
    }

    // Format: 2507XXXXXXXX
    if (/^2507\d{8}$/.test(cleaned)) {
      return `0${cleaned.substring(3)}`;
    }

    // Format: +2507XXXXXXXX
    if (/^\+2507\d{8}$/.test(cleaned)) {
      return `0${cleaned.substring(4)}`;
    }

    throw new BadRequestException(
      'Invalid Rwanda phone number. Use format: 07XXXXXXXX',
    );
  }
}

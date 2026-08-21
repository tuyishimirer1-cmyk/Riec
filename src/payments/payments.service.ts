import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../contact/email.service';

@Injectable()
export class PaymentsService {
  private readonly paypackBaseUrl = 'https://payments.paypack.rw/api';
  private paypackAccessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private async getPaypackAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.paypackAccessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.paypackAccessToken as string;
    }

    try {
      console.log('🔐 Authenticating with Paypack...');
      console.log('   Client ID:', process.env.PAYPACK_CLIENT_ID?.substring(0, 10) + '...');
      console.log('   Client ID Full:', process.env.PAYPACK_CLIENT_ID);
      console.log('   Secret EXISTS:', !!process.env.PAYPACK_CLIENT_SECRET);
      console.log('   Secret LENGTH:', process.env.PAYPACK_CLIENT_SECRET?.length);
      console.log('   Secret First 10 chars:', process.env.PAYPACK_CLIENT_SECRET?.substring(0, 10));
      
      // Try the authorization endpoint
      const response = await axios.post(
        `${this.paypackBaseUrl}/auth/agents/authorize`,
        {
          client_id: process.env.PAYPACK_CLIENT_ID,
          client_secret: process.env.PAYPACK_CLIENT_SECRET,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('✅ Paypack authentication successful!');
      this.paypackAccessToken = response.data.access || response.data.token || response.data.access_token;
      // Token typically expires in 1 hour, refresh 5 mins early
      this.tokenExpiresAt = new Date(Date.now() + 55 * 60 * 1000);
      
      return this.paypackAccessToken as string;
    } catch (error: any) {
      console.error('❌ Paypack auth error:', error.response?.data || error.message);
      console.error('   Status:', error.response?.status);
      console.error('   Full response:', JSON.stringify(error.response?.data, null, 2));
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to authenticate with Paypack',
      );
    }
  }

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
      tierId = null; // null means it's a simple purchase without tier
    }

    // Paypack only supports RWF, convert if needed
    if (currency !== 'RWF') {
      // Simple conversion: 1 USD = 1300 RWF (you should use a real exchange rate API)
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
        flutterwaveRef: '', // Will be updated with Paypack ref
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
      
      // Update purchase with test reference
      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { flutterwaveRef: txRef },
      });

      // Auto-complete the payment in test mode
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
      console.log(`   Token can be used at: ${process.env.FRONTEND_BASE_URL}/payment/result?token=${token}`);

      // Send confirmation email with download link
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
        // Don't fail the payment if email fails
      }

      // Return a test payment link that redirects to success page
      return { 
        link: `${process.env.FRONTEND_BASE_URL}/payment/result?status=success&tx_ref=${txRef}&transaction_id=${purchase.id}&token=${token}`,
        ref: txRef,
        testMode: true,
        token: token,
      };
    }

    // PRODUCTION MODE: Use Paypack API
    try {
      const accessToken = await this.getPaypackAccessToken();

      const paypackResponse = await axios.post(
        `${this.paypackBaseUrl}/transactions/cashin`,
        {
          amount: Math.round(amount), // Paypack requires integer amount
          number: input.email, // Customer identifier (can be phone or email)
          ref: txRef,
          merchant_ref: purchase.id,
          description: `Purchase: ${project.title}`,
          webhook_url: `${process.env.BACKEND_URL}/api/payments/webhook/paypack`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      await this.prisma.purchase.update({
        where: { id: purchase.id },
        data: { flutterwaveRef: txRef },
      });

      // Paypack returns a payment link or QR code
      const paymentLink = paypackResponse.data?.data?.redirect_url || 
                         paypackResponse.data?.redirect_url ||
                         `https://payments.paypack.rw/checkout/${txRef}`;

      return { link: paymentLink, ref: txRef };
    } catch (error: any) {
      console.error('Paypack API error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Payment initialization failed',
      );
    }
  }

  async handleWebhook(body: any) {
    try {
      console.log('📨 Paypack webhook received:', JSON.stringify(body, null, 2));

      // Paypack webhook structure
      const { ref, status, merchant_ref } = body;

      if (!ref && !merchant_ref) {
        console.error('❌ Invalid webhook: missing ref or merchant_ref');
        return { message: 'Invalid webhook data' };
      }

      // Find purchase by transaction reference or merchant reference (purchase ID)
      const purchase = await this.prisma.purchase.findFirst({
        where: {
          OR: [
            { flutterwaveRef: ref },
            { id: merchant_ref },
          ],
        },
      });

      if (!purchase) {
        console.error(`❌ Purchase not found for ref: ${ref} or merchant_ref: ${merchant_ref}`);
        return { message: 'Purchase not found' };
      }

      console.log(`✅ Found purchase: ${purchase.id}, current status: ${purchase.status}`);

      // Paypack status values: 'successful', 'pending', 'failed'
      if (status === 'successful' || status === 'success') {
        const token = randomBytes(24).toString('hex');
        await this.prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'SUCCESS', downloadToken: token },
        });
        console.log(`✅ Purchase ${purchase.id} marked as SUCCESS with token: ${token}`);

        // Fetch project details for email
        const purchaseWithProject = await this.prisma.purchase.findUnique({
          where: { id: purchase.id },
          include: { project: true },
        });

        if (purchaseWithProject && purchaseWithProject.project) {
          // Send confirmation email
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
            // Don't fail the webhook if email fails
          }
        }
      } else if (status === 'failed' || status === 'failure') {
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

    // If purchase has a tier, filter by tier assets; otherwise return all project assets
    if (purchase.tier) {
      return purchase.project.assets.filter(
        (a) => !a.tierId || a.tierId === purchase.tierId,
      );
    } else {
      // For simple purchases without tiers, return all project assets
      return purchase.project.assets;
    }
  }
}

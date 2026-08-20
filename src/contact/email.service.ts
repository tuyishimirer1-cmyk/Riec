import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null;
  private transporter: nodemailer.Transporter | null;

  constructor() {
    const apiKey =
      process.env.RESEND_API_KEY || process.env.VITE_RESEND_EMAIL_API_KEY;

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not configured. Email sending will be disabled.',
      );
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }

    // Initialize Gmail SMTP transporter
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailAppPassword) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000, // 10 seconds  
        socketTimeout: 15000, // 15 seconds
      });
      this.logger.log('Gmail SMTP transporter initialized successfully');
    } else {
      this.transporter = null;
      this.logger.warn('Gmail credentials not configured. Gmail sending disabled.');
    }
  }

  async sendQuoteEmail(formData: {
    projectType: string;
    location: string;
    timeline?: string;
    budgetRange: string;
    servicesNeeded: string;
    size?: string;
    floors?: string;
    name: string;
    company?: string;
    email: string;
    phone?: string;
    notes?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.resend) {
      return { success: false, error: 'Email service is not configured' };
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'RIEC <onboarding@resend.dev>';
    const toEmail = process.env.RESEND_TO_EMAIL || 'delivered@resend.dev';

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: `New Quote Request - ${formData.projectType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316; margin-bottom: 20px;">New Quote Request from RIEC Website</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #334155;">Project Details</h3>
              <p><strong>Project Type:</strong> ${formData.projectType || 'N/A'}</p>
              <p><strong>Location:</strong> ${formData.location || 'N/A'}</p>
              <p><strong>Timeline:</strong> ${formData.timeline || 'N/A'}</p>
              <p><strong>Budget Range:</strong> ${formData.budgetRange || 'N/A'}</p>
              <p><strong>Services Needed:</strong> ${formData.servicesNeeded || 'N/A'}</p>
              <p><strong>Size (m²):</strong> ${formData.size || 'N/A'}</p>
              <p><strong>Number of Floors:</strong> ${formData.floors || 'N/A'}</p>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #334155;">Contact Information</h3>
              <p><strong>Name:</strong> ${formData.name || 'N/A'}</p>
              <p><strong>Company:</strong> ${formData.company || 'N/A'}</p>
              <p><strong>Email:</strong> ${formData.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${formData.phone || 'N/A'}</p>
            </div>
            ${
              formData.notes
                ? `
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #334155;">Additional Notes</h3>
              <p style="white-space: pre-wrap;">${formData.notes}</p>
            </div>
            `
                : ''
            }
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #64748b; font-size: 12px;">This email was sent from the RIEC website quote request form.</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Resend error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error('Send quote email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendReplyEmail(params: {
    to: string;
    name: string;
    originalMessage: string;
    reply: string;
    subject?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    // Try Gmail SMTP first (more reliable)
    if (this.transporter) {
      try {
        const gmailFrom = process.env.GMAIL_USER || 'RIEC';
        const emailSubject = params.subject
          ? `Re: ${params.subject}`
          : 'Response to Your Inquiry - RIEC';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">RIEC</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Rwanda Innovation and Engineering Company</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #111827; font-size: 16px; margin-bottom: 8px;">Dear ${params.name},</p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Thank you for contacting RIEC. We appreciate your inquiry and are pleased to respond.
              </p>

              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 24px;">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${params.reply}</p>
              </div>

              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase;">Your Original Message:</p>
                <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${params.originalMessage}</p>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                If you have any further questions, please don't hesitate to reach out to us again.
              </p>

              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 4px 0;">Best regards,</p>
                <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 4px 0;">RIEC Team</p>
                <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0 0;">
                  KG 11 Ave, Kimironko, Kigali, Rwanda<br/>
                  Phone: +250 787 106 854 | Email: riec2025@gmail.com
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                This email was sent from RIEC in response to your inquiry.<br/>
                © 2026 Rwanda Innovation and Engineering Company. All rights reserved.
              </p>
            </div>
          </div>
        `;

        const info = await this.transporter.sendMail({
          from: `"RIEC" <${gmailFrom}>`,
          to: params.to,
          subject: emailSubject,
          html: htmlContent,
        });

        this.logger.log(`Email sent successfully via Gmail: ${info.messageId}`);
        return { success: true, data: { messageId: info.messageId } };
      } catch (error) {
        this.logger.error('Gmail SMTP error:', error);
        // Fall through to try Resend
      }
    }

    // Fallback to Resend if Gmail fails or isn't configured
    if (!this.resend) {
      return { success: false, error: 'Email service is not configured' };
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'RIEC <onboarding@resend.dev>';

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: [params.to],
        subject: params.subject
          ? `Re: ${params.subject}`
          : 'Response to Your Inquiry - RIEC',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">RIEC</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Rwanda Innovation and Engineering Company</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #111827; font-size: 16px; margin-bottom: 8px;">Dear ${params.name},</p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Thank you for contacting RIEC. We appreciate your inquiry and are pleased to respond.
              </p>

              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 24px;">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${params.reply}</p>
              </div>

              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #6b7280; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase;">Your Original Message:</p>
                <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${params.originalMessage}</p>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                If you have any further questions, please don't hesitate to reach out to us again.
              </p>

              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 4px 0;">Best regards,</p>
                <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 4px 0;">RIEC Team</p>
                <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0 0;">
                  KG 11 Ave, Kimironko, Kigali, Rwanda<br/>
                  Phone: +250 787 106 854 | Email: riec2025@gmail.com
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                This email was sent from RIEC in response to your inquiry.<br/>
                © 2026 Rwanda Innovation and Engineering Company. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Resend reply email error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email',
        };
      }

      return { success: true, data };
    } catch (error) {
      this.logger.error('Send reply email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send project purchase confirmation email with PDF download link
   */
  async sendProjectPurchaseEmail(params: {
    to: string;
    customerName: string;
    projectName: string;
    projectDescription?: string;
    downloadToken: string;
    transactionId: string;
    amount?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    // Use Gmail SMTP for purchase emails (more reliable)
    if (!this.transporter) {
      return { success: false, error: 'Gmail SMTP is not configured' };
    }

    try {
      const gmailFrom = process.env.GMAIL_USER || 'riec2025@gmail.com';
      const frontendUrl = process.env.FRONTEND_BASE_URL || 'https://www.riec.rw';
      const downloadUrl = `${frontendUrl}/payment/result?token=${params.downloadToken}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">RIEC</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 16px;">Room of Innovative and Engineering Construction</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px 0;">Your RIEC Project Purchase – Download Your Full Project</h2>
            
            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Hello <strong>${params.customerName}</strong>,
            </p>

            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Thank you for your purchase from RIEC.
            </p>

            <div style="background: #f0fdf4; border: 2px solid #86efac; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
              <p style="color: #166534; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">✅ Payment Successfully Confirmed</p>
              <p style="color: #15803d; font-size: 14px; margin: 0;">Transaction ID: ${params.transactionId}</p>
            </div>

            <div style="background: #f9fafb; padding: 24px; border-radius: 8px; border-left: 4px solid #f97316; margin-bottom: 24px;">
              <h3 style="color: #111827; font-size: 16px; margin: 0 0 12px 0;">📁 Purchased Project:</h3>
              <p style="color: #374151; font-size: 15px; margin: 0 0 8px 0;"><strong>${params.projectName}</strong></p>
              ${params.projectDescription ? `<p style="color: #6b7280; font-size: 14px; margin: 0;">${params.projectDescription}</p>` : ''}
              ${params.amount ? `<p style="color: #374151; font-size: 14px; margin: 8px 0 0 0;"><strong>Amount Paid:</strong> ${params.amount}</p>` : ''}
            </div>

            <div style="background: #fff7ed; padding: 24px; border-radius: 8px; border: 2px solid #fdba74; margin-bottom: 24px;">
              <h3 style="color: #9a3412; font-size: 16px; margin: 0 0 12px 0;">🔑 Your Download Token:</h3>
              <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #fed7aa; margin-bottom: 16px;">
                <code style="color: #ea580c; font-size: 14px; font-family: 'Courier New', monospace; word-break: break-all;">${params.downloadToken}</code>
              </div>
              <p style="color: #9a3412; font-size: 13px; margin: 0; line-height: 1.6;">
                <strong>Important:</strong> Save this token. You can use it to download your purchased files anytime within the next 48 hours.
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${downloadUrl}" style="display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Download Your Project Files
              </a>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">📥 How to Download:</p>
              <ol style="color: #6b7280; font-size: 13px; line-height: 1.7; margin: 0; padding-left: 20px;">
                <li>Click the download button above, OR</li>
                <li>Visit <a href="${downloadUrl}" style="color: #f97316;">${downloadUrl}</a></li>
                <li>Your token will be automatically filled in</li>
                <li>Click "Load downloads" to see your files</li>
                <li>Download each file you need</li>
              </ol>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              If you experience any problem accessing the files, please don't hesitate to contact us with your download token and transaction ID.
            </p>

            <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 4px 0;">Thank you for choosing RIEC.</p>
              <p style="color: #111827; font-size: 16px; font-weight: 600; margin: 8px 0;">Best regards,</p>
              <p style="color: #374151; font-size: 15px; font-weight: 600; margin: 4px 0;">RIEC Ltd</p>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0;">Room of Innovative and Engineering Construction</p>
              <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0 0; line-height: 1.6;">
                Kigali, Rwanda<br/>
                +250 787 106 854 | +250 784 231 101<br/>
                <a href="mailto:riec2025@gmail.com" style="color: #f97316; text-decoration: none;">riec2025@gmail.com</a><br/>
                <a href="https://www.riec.rw" style="color: #f97316; text-decoration: none;">www.riec.rw</a>
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.6;">
              This email was sent to confirm your project purchase from RIEC.<br/>
              © 2026 Room of Innovative and Engineering Construction. All rights reserved.
            </p>
          </div>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: `"RIEC" <${gmailFrom}>`,
        to: params.to,
        subject: `Your RIEC Project Purchase – ${params.projectName}`,
        html: htmlContent,
        text: `Hello ${params.customerName},

Thank you for your purchase from RIEC.

Your payment has been successfully confirmed. 

Purchased Project: ${params.projectName}
Transaction ID: ${params.transactionId}
${params.amount ? `Amount Paid: ${params.amount}` : ''}

Download Token: ${params.downloadToken}

You can download your project files at: ${downloadUrl}

If you experience any problem accessing the files, please contact us with your download token.

Thank you for choosing RIEC.

Best regards,
RIEC Ltd
Room of Innovative and Engineering Construction
Kigali, Rwanda
+250 787 106 854 | +250 784 231 101
riec2025@gmail.com
www.riec.rw`,
      });

      this.logger.log(`Project purchase email sent successfully: ${info.messageId}`);
      return { success: true, data: { messageId: info.messageId } };
    } catch (error) {
      this.logger.error('Send project purchase email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

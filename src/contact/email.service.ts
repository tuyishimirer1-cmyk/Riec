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
}

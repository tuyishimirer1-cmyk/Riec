import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null;

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
}

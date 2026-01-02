import { Resend } from "resend";
import { env } from "@/env";

// Initialize Resend client (will be null if API key not configured)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Default from email (user needs to configure this)
const FROM_EMAIL = env.RESEND_FROM_EMAIL || "noreply@example.com";

export interface SendVerificationEmailParams {
  to: string;
  code: string;
  userName?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send verification email with 6-digit code
 */
export async function sendVerificationEmail({
  to,
  code,
  userName,
}: SendVerificationEmailParams): Promise<EmailResult> {
  if (!resend) {
    console.warn("⚠️ Resend not configured. Verification code:", code);
    // In development, log the code instead of sending email
    return {
      success: true,
      messageId: "dev-mode-no-email-sent",
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: "Verify your email - Playmaker",
      html: generateVerificationEmailHtml(code, userName),
      text: generateVerificationEmailText(code, userName),
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail({
  to,
  userName,
  facilityName,
  courtName,
  date,
  startTime,
  endTime,
}: {
  to: string;
  userName: string;
  facilityName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<EmailResult> {
  if (!resend) {
    console.warn("⚠️ Resend not configured. Skipping booking confirmation email.");
    return { success: true, messageId: "dev-mode-no-email-sent" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Booking Confirmed - ${facilityName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Booking Confirmed! ✓</h1>
          <p>Hi ${userName},</p>
          <p>Your booking has been confirmed:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Facility:</strong> ${facilityName}</p>
            <p><strong>Court:</strong> ${courtName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Please arrive on time. Failure to show up may affect your future booking privileges.
          </p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate HTML email template for verification
 */
function generateVerificationEmailHtml(code: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin-bottom: 10px;">🎾 Playmaker</h1>
        </div>
        
        <div style="background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email</h2>
          
          <p>${greeting}</p>
          
          <p>To complete your registration and start booking courts, please enter this verification code:</p>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 25px 0;">
            ${code}
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Playmaker. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email for verification
 */
function generateVerificationEmailText(code: string, userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi,";
  
  return `
${greeting}

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.

- Playmaker Team
  `.trim();
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!resend && !!env.RESEND_FROM_EMAIL;
}

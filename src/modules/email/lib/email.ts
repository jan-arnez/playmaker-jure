import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { notifications } from "@/lib/platform-notifications";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailValues {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

type TemplateVariables = Record<string, string | number>;

/**
 * Get email template from database
 */
async function getEmailTemplate(templateKey: string): Promise<EmailTemplate | null> {
  try {
    const setting = await prisma.platformSettings.findUnique({
      where: { key: templateKey },
    });

    if (!setting?.value) {
      return null;
    }

    return setting.value as EmailTemplate;
  } catch (error) {
    console.error(`Failed to fetch email template ${templateKey}:`, error);
    return null;
  }
}

/**
 * Replace template variables like {{userName}} with actual values
 */
function replaceVariables(text: string, variables: TemplateVariables): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

/**
 * Convert markdown to simple HTML for email
 */
function markdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

/**
 * Send email using raw values (backward compatible)
 */
export async function sendEmail({ to, subject, text, html }: SendEmailValues) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Playmaker <noreply@playmaker.si>",
      to,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

/**
 * Send templated email - fetches template from database and replaces variables
 * 
 * @param templateKey - e.g., "email.template.bookingConfirmation"
 * @param to - recipient email
 * @param variables - object with values to replace in template
 * @returns success status
 */
export async function sendTemplatedEmail(
  templateKey: string,
  to: string,
  variables: TemplateVariables
): Promise<{ success: boolean; error?: string }> {
  // Fetch template from database
  const template = await getEmailTemplate(templateKey);

  // If template not found, create notification and DON'T send email
  if (!template) {
    await notifications.emailTemplateMissing(templateKey);
    console.error(`Email template not found: ${templateKey}`);
    return { 
      success: false, 
      error: `Template ${templateKey} not found. Email was not sent.` 
    };
  }

  try {
    // Replace variables
    const subject = replaceVariables(template.subject, variables);
    const textBody = replaceVariables(template.body, variables);
    const htmlBody = markdownToHtml(textBody);

    // Send email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Playmaker <noreply@playmaker.si>",
      to,
      subject,
      text: textBody,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              p { margin: 0 0 1em 0; }
              ul { margin: 0.5em 0; padding-left: 1.5em; }
              li { margin: 0.25em 0; }
              strong { font-weight: 600; }
            </style>
          </head>
          <body style="padding: 20px; max-width: 600px; margin: 0 auto;">
            ${htmlBody}
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await notifications.emailSendFailed(templateKey, to, errorMessage);
    console.error(`Failed to send email ${templateKey} to ${to}:`, error);
    return { success: false, error: errorMessage };
  }
}

// Pre-built email sending functions for common scenarios
export const emails = {
  /**
   * Send booking confirmation email
   */
  bookingConfirmation: (
    to: string,
    variables: {
      userName: string;
      facilityName: string;
      facilityAddress: string;
      bookingDate: string;
      bookingTime: string;
      courtName: string;
      price: string;
    }
  ) => sendTemplatedEmail("email.template.bookingConfirmation", to, variables),

  /**
   * Send booking reminder email (24h before)
   */
  bookingReminder: (
    to: string,
    variables: {
      userName: string;
      facilityName: string;
      facilityAddress: string;
      bookingDate: string;
      bookingTime: string;
    }
  ) => sendTemplatedEmail("email.template.bookingReminder", to, variables),

  /**
   * Send booking cancellation email
   */
  bookingCancellation: (
    to: string,
    variables: {
      userName: string;
      facilityName: string;
      facilityAddress: string;
      bookingDate: string;
      bookingTime: string;
    }
  ) => sendTemplatedEmail("email.template.bookingCancellation", to, variables),

  /**
   * Send no-show warning email
   */
  noShowWarning: (
    to: string,
    variables: {
      userName: string;
      facilityName: string;
      bookingDate: string;
      strikeCount: number;
      strikesForBan: number;
    }
  ) => sendTemplatedEmail("email.template.noShowWarning", to, variables),

  /**
   * Send welcome email to new users
   */
  welcome: (
    to: string,
    variables: {
      userName: string;
      appUrl: string;
    }
  ) => sendTemplatedEmail("email.template.welcome", to, variables),
};

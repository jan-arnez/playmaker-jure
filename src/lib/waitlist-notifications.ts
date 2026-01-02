import { randomBytes } from "node:crypto";
import { sendEmail } from "@/modules/email/lib/email";
import { sendSMS } from "@/lib/sms-service";

// Generate a secure reservation token
export function generateReservationToken(): string {
  return randomBytes(32).toString("base64url");
}

// Generate reservation link URL
export function generateReservationLink(token: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${url}/reserve/${token}`;
}

// Send waitlist notification email
export async function sendWaitlistEmailNotification(
  email: string,
  name: string | null,
  facilityName: string,
  courtName: string,
  startTime: Date,
  reservationLink: string,
): Promise<void> {
  const formattedDate = startTime.toLocaleDateString("sl-SI", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = startTime.toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `Court Available - ${facilityName}`;
  const text = `
Pozdravljeni${name ? ` ${name}` : ""}!

Court je na voljo! 🎾

${facilityName} - ${courtName}
${formattedDate} ob ${formattedTime}

Rezervirajte v 30 minutah:
${reservationLink}

Ta povezava je veljavna 30 minut. Če ne rezervirate v tem času, bo ponudba prešla na naslednjo osebo na čakalni vrsti.

Lep pozdrav,
Playmaker Team
  `.trim();

  try {
    await sendEmail({
      to: email,
      subject,
      text,
    });
  } catch (error) {
    console.error("Failed to send waitlist email notification:", error);
    throw error;
  }
}

// Send waitlist SMS notification via SMS.si
export async function sendWaitlistSMSNotification(
  phone: string,
  facilityName: string,
  courtName: string,
  startTime: Date,
  reservationLink: string,
): Promise<void> {
  const formattedDate = startTime.toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "numeric",
  });
  const formattedTime = startTime.toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Short message for SMS (max 160 characters recommended)
  const message = `Court na voljo! ${facilityName} - ${courtName}, ${formattedDate} ${formattedTime}. Rezervirajte v 30min: ${reservationLink}`;

  try {
    const result = await sendSMS({
      phone,
      message,
    });

    if (!result.success) {
      console.error("Failed to send waitlist SMS:", result.error);
      throw new Error(result.error || "Failed to send SMS");
    }

    console.log("Waitlist SMS sent successfully:", result.messageId);
  } catch (error) {
    console.error("Error sending waitlist SMS notification:", error);
    throw error;
  }
}


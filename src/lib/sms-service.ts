/**
 * SMS.si API Integration
 * Documentation: https://www.smsapi.si/smsapi
 */

interface SendSMSOptions {
  phone: string;
  message: string;
  senderId?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalize phone number to format expected by SMS.si
 * Removes spaces, dashes, and ensures proper format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "");
  
  // If it starts with +386 (Slovenia), keep it
  if (normalized.startsWith("+386")) {
    return normalized;
  }
  
  // If it starts with 386, add +
  if (normalized.startsWith("386")) {
    return `+${normalized}`;
  }
  
  // If it starts with 0, replace with +386
  if (normalized.startsWith("0")) {
    return `+386${normalized.substring(1)}`;
  }
  
  // If it's just digits, assume it's a Slovenian number without country code
  if (/^\d+$/.test(normalized)) {
    return `+386${normalized}`;
  }
  
  // Return as is if it already has +
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

/**
 * Send SMS via SMS.si API
 */
export async function sendSMS({
  phone,
  message,
  senderId,
}: SendSMSOptions): Promise<SMSResponse> {
  const apiUsername = process.env.SMS_SI_USERNAME;
  const apiPassword = process.env.SMS_SI_PASSWORD;
  const defaultSenderId = process.env.SMS_SI_SENDER_ID || "Playmaker";

  if (!apiUsername || !apiPassword) {
    console.error("SMS.si credentials not configured");
    return {
      success: false,
      error: "SMS service not configured",
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const sender = senderId || defaultSenderId;

  // Prepare form data
  const formData = new URLSearchParams();
  formData.append("un", apiUsername);
  formData.append("ps", apiPassword);
  formData.append("from", sender);
  formData.append("to", normalizedPhone);
  formData.append("m", message);
  formData.append("cc", "386"); // Slovenia country code

  try {
    const response = await fetch("https://www.smsapi.si/poslji-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await response.text();

    // SMS.si API returns different response formats
    // Success typically contains "OK" or message ID
    // Error contains error description
    if (response.ok) {
      // Check if response indicates success
      if (responseText.includes("OK") || responseText.match(/^\d+$/)) {
        return {
          success: true,
          messageId: responseText.trim(),
        };
      }

      // If response doesn't indicate success, treat as error
      return {
        success: false,
        error: responseText || "Unknown error from SMS.si",
      };
    }

    return {
      success: false,
      error: `HTTP ${response.status}: ${responseText}`,
    };
  } catch (error) {
    console.error("SMS.si API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Basic validation: should start with + and have 8-15 digits
  return /^\+\d{8,15}$/.test(normalized);
}


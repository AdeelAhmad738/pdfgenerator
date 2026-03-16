import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  recipient?: string;
  emailId?: string;
}

const jsonResponse = (data: EmailResponse, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateEmailTemplate = (
  subject: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Collaborative Task Manager</h1>
          </div>
          
          <!-- Content -->
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #0f172a; margin: 0 0 15px; font-size: 20px; font-weight: 600;">${subject}</h2>
            <p style="color: #475569; margin: 0 0 20px; line-height: 1.6; font-size: 15px;">${message}</p>
            
            ${
              actionUrl && actionLabel
                ? `
            <div style="margin: 30px 0;">
              <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                ${actionLabel}
              </a>
            </div>
            `
                : ""
            }
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              This is an automated message from Collaborative Task Manager. Please do not reply to this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© 2026 Collaborative Task Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return jsonResponse({ success: true });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405
    );
  }

  try {
    const body = await req.json() as EmailRequest;
    const { to, subject, message, actionUrl, actionLabel } = body;

    // Validate required fields
    if (!to || !subject || !message) {
      return jsonResponse(
        {
          success: false,
          error: "Missing required fields: to, subject, message",
        },
        400
      );
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return jsonResponse(
        { success: false, error: "Invalid recipient email address" },
        400
      );
    }

    // Get configuration from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ||
      "noreply@resend.dev";

    if (!resendApiKey) {
      console.error("[Email] Missing RESEND_API_KEY environment variable");
      return jsonResponse(
        {
          success: false,
          error: "Email service not properly configured",
        },
        503
      );
    }

    console.log(`[Email] Sending email to: ${to}, Subject: ${subject}`);

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: to,
        subject: subject,
        html: generateEmailTemplate(subject, message, actionUrl, actionLabel),
        reply_to: "noreply@resend.dev",
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as Record<string, unknown>;
      const errorMsg = typeof errorData.message === "string"
        ? errorData.message
        : "Failed to send email via Resend";
      console.error(`[Email] Resend API error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = (await response.json()) as Record<string, unknown>;

    console.log(`[Email] Successfully sent email to ${to}, ID: ${data.id}`);

    return jsonResponse(
      {
        success: true,
        message: "Email sent successfully",
        recipient: to,
        emailId: data.id as string,
      },
      200
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error
      ? error.message
      : String(error);
    console.error(`[Email] Error: ${errorMessage}`);
    return jsonResponse(
      {
        success: false,
        error: errorMessage || "Failed to send email",
      },
      500
    );
  }
});

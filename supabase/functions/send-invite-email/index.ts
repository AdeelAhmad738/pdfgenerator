import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { to, subject, message } = await req.json()

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const client = new SmtpClient()

    const smtpHostname = Deno.env.get("SMTP_HOSTNAME")
    const smtpUsername = Deno.env.get("SMTP_USERNAME")
    const smtpPassword = Deno.env.get("SMTP_PASSWORD")
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL")

    if (!smtpHostname || !smtpUsername || !smtpPassword || !smtpFromEmail) {
      console.error("Missing SMTP configuration in environment variables")
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    await client.connectTLS({
      hostname: smtpHostname,
      port: 587,
      username: smtpUsername,
      password: smtpPassword,
    })

    await client.send({
      from: smtpFromEmail,
      to: to,
      subject: subject,
      content: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Log in to your Task Manager to view more details.</p>
        </div>
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Email send error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

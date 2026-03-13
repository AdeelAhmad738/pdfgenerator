// Supabase Edge Function: send-invite
// Template only. You must wire an email provider (Resend, SendGrid, Mailgun).
// Expects POST { to, invite_id, inviter_email, invite_link }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  })

serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const body = await req.json()
    const { to, invite_id, inviter_email, invite_link } = body || {}

    if (!to || !invite_id || !invite_link) {
      return json({ error: "Missing required fields." }, 400)
    }

    // TODO: Plug in an email provider.
    // Example pseudo-code (Resend):
    // const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    // const res = await fetch("https://api.resend.com/emails", { ... })
    // if (!res.ok) throw new Error("Email provider failed")

    return json({
      ok: true,
      message: "Invite email queued (template only).",
      to,
      invite_id,
      inviter_email: inviter_email || null,
      invite_link,
    })
  } catch (err) {
    return json({ error: "Invalid JSON or server error." }, 500)
  }
})

# Email Notifications Setup Guide

## Overview
Email notifications are sent when:
1. **Task Created with Assignment** - Assigned user receives notification
2. **Collaboration Invite Sent** - Invited user receives notification

## Problem Fixed
The email sending function was not being called during task creation/assignment. This has been fixed in:
- `src/context/TaskContext.jsx` - `addTask()` and `updateTask()` functions now call `sendInviteEmail()`

## Setup Required

### Step 1: Create a Supabase Edge Function

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions** (SQL Editor → Functions section)
3. Create a new function named `send-invite-email`
4. Use this template:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const client = new SmtpClient()

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { to, subject, message } = await req.json()

    // Configure your SMTP credentials
    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOSTNAME") || "smtp.gmail.com",
      port: 587,
      username: Deno.env.get("SMTP_USERNAME") || "",
      password: Deno.env.get("SMTP_PASSWORD") || "",
    })

    await client.send({
      from: Deno.env.get("SMTP_FROM_EMAIL") || "noreply@taskmanager.com",
      to: to,
      subject: subject,
      content: message,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        <p>Log in to your task manager to view more details.</p>
      `,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Email send failed:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### Step 2: Set Environment Variables in Supabase

In your Supabase project settings, set these secrets:
- `SMTP_HOSTNAME` - Your email provider's SMTP server (e.g., `smtp.gmail.com`)
- `SMTP_USERNAME` - Your email account
- `SMTP_PASSWORD` - Your email password or app-specific password
- `SMTP_FROM_EMAIL` - The "from" address for emails

### Step 3: Update `.env` File

After creating the Edge Function, add the endpoint to your `.env`:

```
REACT_APP_INVITE_FUNCTION_URL=https://your-project-id.supabase.co/functions/v1/send-invite-email
```

Replace `your-project-id` with your actual Supabase project ID.

### Step 4: Test It

1. Create a task and assign it to another email
2. Check that email for a notification
3. Or send a collaboration invite from Settings → Collaboration

## Alternative: Using Third-Party Email Services

Instead of SMTP, you can use:
- **SendGrid** - Update the Edge Function to use their API
- **Mailgun** - Similar API integration
- **Resend** - Modern email API

Each requires updating the Edge Function code and environment variables.

## Debugging

If emails aren't being sent:
1. Check browser console for errors
2. Verify `REACT_APP_INVITE_FUNCTION_URL` is set in `.env`
3. Check Supabase Edge Function logs
4. Ensure SMTP credentials are correct
5. Check email provider's security settings (may need to allow "Less secure apps" or generate app-specific password)

## How It Works Now

```
User creates task with email → TaskContext.addTask() 
  → Sends to Supabase DB ✅
  → Creates invite record ✅
  → Calls sendInviteEmail() ✅ (NEW)
    → Fetches REACT_APP_INVITE_FUNCTION_URL
    → Sends POST request to Edge Function
    → Email Function sends SMTP email
```

# Supabase Edge Function Setup - send-invite-email

## Overview
The file `supabase/functions/send-invite-email/index.ts` contains the email service function that sends notifications when tasks are assigned.

---

## Quick Deploy Steps

### Option A: Using Supabase CLI (Recommended)

**1. Install Supabase CLI:**
```powershell
npm install -g supabase
```

**2. Login to Supabase:**
```powershell
supabase login
```

**3. Link your project:**
```powershell
supabase link --project-ref your-project-id
```
(Get your project ID from Supabase dashboard URL: `https://app.supabase.com/project/your-project-id`)

**4. Deploy the function:**
```powershell
supabase functions deploy send-invite-email
```

**5. Verify deployment:**
```powershell
supabase functions list
```

---

### Option B: Manual Deploy via Supabase Dashboard

**1. Go to Supabase Dashboard** → Your Project → **Edge Functions**

**2. Click "Create a new function"**

**3. Name it exactly: `send-invite-email`**

**4. Paste the code from `supabase/functions/send-invite-email/index.ts`**

**5. Click "Deploy"**

---

## Configure SMTP Credentials

After deploying the function, add email secrets:

**1. Go to Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**

**2. Add these environment variables:**

| Secret Name | Value | Example |
|-------------|-------|---------|
| `SMTP_HOSTNAME` | Your SMTP server | `smtp.gmail.com` |
| `SMTP_USERNAME` | Your email address | `your-email@gmail.com` |
| `SMTP_PASSWORD` | App password | 16-character password |
| `SMTP_FROM_EMAIL` | Sender email | `your-email@gmail.com` |

---

## Setup with Gmail (Easiest)

### Step 1: Enable 2FA on Gmail
1. Go to https://myaccount.google.com
2. Left sidebar → **Security**
3. Enable **2-Step Verification**

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** and **Windows Computer**
3. Click **Generate**
4. Copy the **16-character password** shown

### Step 3: Add Secrets to Supabase

Go to **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**

Add:
- `SMTP_HOSTNAME` = `smtp.gmail.com`
- `SMTP_USERNAME` = `your-email@gmail.com`
- `SMTP_PASSWORD` = `paste-16-char-password-here`
- `SMTP_FROM_EMAIL` = `your-email@gmail.com`

Click **Add secret** for each one.

---

## Setup with Mailgun (Alternative)

### Step 1: Create Mailgun Account
1. Go to https://www.mailgun.com
2. Sign up and create a domain
3. Go to **Sending** → **Domain Settings**
4. Copy your **SMTP credentials**

### Step 2: Add Secrets

- `SMTP_HOSTNAME` = `smtp.mailgun.org`
- `SMTP_USERNAME` = `postmaster@your-domain.mailgun.org`
- `SMTP_PASSWORD` = `your-mailgun-password`
- `SMTP_FROM_EMAIL` = `noreply@your-domain.mailgun.org`

---

## Setup with SendGrid (Alternative)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up and create API key
3. API key = SMTP password

### Step 2: Add Secrets

- `SMTP_HOSTNAME` = `smtp.sendgrid.net`
- `SMTP_USERNAME` = `apikey`
- `SMTP_PASSWORD` = `SG.your-api-key-here`
- `SMTP_FROM_EMAIL` = `noreply@yourdomain.com`

---

## Get Your Function URL

After deployment:
1. Go to Supabase Dashboard → **Edge Functions**
2. Click `send-invite-email` function
3. Copy the **URL** from the top
4. It looks like: `https://your-project-abc123.supabase.co/functions/v1/send-invite-email`

---

## Update React App

Add the function URL to `.env`:

```
REACT_APP_INVITE_FUNCTION_URL=https://your-project-abc123.supabase.co/functions/v1/send-invite-email
```

Then restart your app:
```powershell
npm start
```

---

## Test It

1. Create a task and assign it to another email
2. Open browser **DevTools** (F12) → **Console**
3. Check the assigned user's email for notification
4. If it fails, check Supabase Edge Function logs for errors

---

## Troubleshooting

**"Email service not configured"**
- Make sure all 4 secrets are added in Supabase
- Restart the function after adding secrets

**"Connection refused" or timeout**
- Wrong SMTP hostname
- Check SMTP port (Gmail uses 587, not 465)

**Email goes to spam**
- Gmail: Verify "Less secure app" is allowed OR use app password
- Mailgun/SendGrid: Verify domain authentication

**Function not found (404 error)**
- Make sure function URL in `.env` is correct
- Function name must be `send-invite-email` (lowercase with hyphens)

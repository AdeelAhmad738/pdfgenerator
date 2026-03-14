# What to Do on Supabase.com - Complete Step by Step

## STEP 1: CREATE ACCOUNT & PROJECT

### 1.1 Go to Supabase
- Open: https://supabase.com
- Click "Start your project" (top right)
- Sign up with GitHub or Email

### 1.2 Create New Project
- Click "New Project"
- Fill in details:
  - **Organization:** Your name/company
  - **Project Name:** `pdfgenerator`
  - **Database Password:** Create STRONG password (save it!)
  - **Region:** Choose closest to your users (e.g., us-east-1 for USA)
- Click "Create new project"
- **WAIT 5-10 MINUTES** for initialization

---

## STEP 2: GET API CREDENTIALS

### 2.1 Navigate to API Settings
- Once project loads, click **Settings** (bottom left sidebar)
- Click **API** (left menu)

### 2.2 Copy Credentials

You'll see:
```
Project URL:     https://gcxmfwvuqbykpghebdfn.supabase.co
Anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**COPY THESE:**
- **Project URL** → Save to `.env` as `REACT_APP_SUPABASE_URL`
- **Anon public key** → Save to `.env` as `REACT_APP_SUPABASE_ANON_KEY`

---

## STEP 3: CREATE DATABASE TABLES

### 3.1 Open SQL Editor
- Click **SQL Editor** (left sidebar)
- Click **New Query** button

### 3.2 Copy & Paste SQL Schema

Go to your project root, open file: `supabase-schema.sql`

Copy ALL the SQL code from that file.

Paste in Supabase SQL Editor.

Click **Run** (or press Ctrl+Enter)

**WAIT** for all tables to be created (1-2 minutes)

---

## STEP 4: ENABLE AUTHENTICATION

### 4.1 Go to Auth Settings
- Click **Authentication** (left sidebar)
- Click **Providers** (under Settings)

### 4.2 Enable Email Provider
- Find **Email** provider
- Toggle it **ON**
- Settings should auto-populate
- No changes needed

### 4.3 Go to URL Configuration
- Click **Authentication** > **URL Configuration**
- Set **Site URL:** `http://localhost:3000` (for local testing)
- After deployment, change to: `https://yourdomain.vercel.app`

---

## STEP 5: CREATE STORAGE BUCKET

### 5.1 Go to Storage
- Click **Storage** (left sidebar)
- You should see a bucket list (empty at first)

### 5.2 Create Bucket
- Click **Create new bucket**
- Name: `task-files`
- **Enable public bucket** (checkbox)
- Click **Create bucket**

### 5.3 Set Bucket Policies (Storage Rules)
- Click on `task-files` bucket
- Click **Policies** tab
- You should see 3 pre-created policies:
  - "Public read task files" ✅
  - "User write task files" ✅
  - "User delete task files" ✅
- If not showing, the SQL script already created them

---

## STEP 6: VERIFY ROW LEVEL SECURITY (RLS)

### 6.1 Go to Database > Tables
- Click **Database** (left sidebar)
- Click **Tables** submenu
- You should see these tables:
  ```
  ✅ auth.users (auto-created by Supabase)
  ✅ tasks
  ✅ task_templates
  ✅ task_views
  ✅ task_invites
  ✅ task_drafts
  ✅ task_notifications
  ✅ task_activity
  ✅ task_attachments
  ```

### 6.2 Check RLS is Enabled
- Click on **tasks** table
- Go to **RLS** tab
- Verify: "Row Level Security is enabled for this table"
- You should see 4 policies:
  - Tasks select
  - Tasks insert
  - Tasks update
  - Tasks delete

**Repeat for all other tables** (they should all have RLS enabled)

---

## STEP 7: CREATE EDGE FUNCTION FOR EMAILS (Optional)

### 7.1 Go to Edge Functions
- Click **Edge Functions** (left sidebar)
- Click **Create a new function**
- Name: `send-invite-email`
- Click **Create function**

### 7.2 Copy Function Code
Replace template code with:

```javascript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { to, subject, message } = await req.json()

  // Example using Resend (email service)
  // Replace with your email service (SendGrid, Mailgun, etc.)
  
  return new Response(
    JSON.stringify({ success: true, message: "Email queued" }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  )
})
```

**NOTE:** This is a placeholder. You'll need to integrate with an email service:
- **Resend** (recommended)
- SendGrid
- Mailgun
- AWS SES

### 7.3 Deploy Function
- Click **Deploy**
- You'll get URL: `https://your-project.supabase.co/functions/v1/send-invite-email`

---

## STEP 8: UPDATE YOUR PROJECT `.env` FILE

After getting everything from Supabase.com, update your project:

**File:** `.env` (in project root)

```env
# From Supabase > Settings > API
REACT_APP_SUPABASE_URL=https://gcxmfwvuqbykpghebdfn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# From Supabase > Edge Functions (if using)
REACT_APP_INVITE_FUNCTION_URL=https://gcxmfwvuqbykpghebdfn.supabase.co/functions/v1/send-invite-email
```

---

## STEP 9: TEST CONNECTION

### 9.1 In Project Terminal
```powershell
npm install @supabase/supabase-js
```

### 9.2 Start App
```powershell
npm start
```

### 9.3 Test Sign Up
- Go to `http://localhost:3000`
- Click "Sign up"
- Create account with email/password
- Check Supabase > Authentication > Users tab
- Your user should appear there ✅

---

## STEP 10: MONITOR & MANAGE

### 10.1 View Real Data
- **Users:** Authentication > Users tab
- **Tasks:** Database > tasks table (data browser)
- **Invites:** Database > task_invites table
- **Notifications:** Database > task_notifications table

### 10.2 View Logs
- **Edge Function Logs:** Edge Functions > Function > Logs
- **Database Logs:** Database > Logs tab
- **Auth Logs:** Authentication > Logs tab

### 10.3 Backup Data
- Go to **Settings > Backups**
- Enable automatic backups (recommended)
- Manual backup available anytime

---

## STEP 11: AFTER DEPLOYMENT TO VERCEL

### 11.1 Update URL Configuration
- Supabase > Authentication > URL Configuration
- Change **Site URL** to: `https://yourapp.vercel.app`

### 11.2 Update Environment Variables
- Go to Vercel project settings
- Add same `.env` variables:
  ```
  REACT_APP_SUPABASE_URL
  REACT_APP_SUPABASE_ANON_KEY
  REACT_APP_INVITE_FUNCTION_URL
  ```

---

## CHECKLIST - What You Did on Supabase.com

- [ ] Created Supabase account & project
- [ ] Copied Project URL & Anon Key
- [ ] Ran SQL schema (created all tables)
- [ ] Enabled Email authentication
- [ ] Set URL Configuration
- [ ] Created `task-files` storage bucket
- [ ] Verified RLS on all tables
- [ ] Created Edge Function for emails (optional)
- [ ] Tested sign up & user creation
- [ ] Updated `.env` file in project
- [ ] Started app with `npm start`
- [ ] Verified tables have data

---

## IMPORTANT NOTES

⚠️ **Security:**
- Never share your Anon Key publicly
- Keep `.env` file in `.gitignore`
- RLS policies protect user data

⚠️ **Pricing:**
- Free tier: 500MB database, 1GB storage
- No credit card needed for free tier
- Upgrade if you exceed limits

⚠️ **Backups:**
- Enable automatic backups in Settings
- Supabase keeps 7-day backup history

⚠️ **Email Service:**
- Email function needs configuration
- Use Resend (easiest) or SendGrid
- Get API key from email provider

---

## TROUBLESHOOTING

**"Tables not created"**
- Check SQL ran without errors
- Refresh page
- Check Database > Tables tab

**"Auth not working"**
- Verify Email provider is enabled
- Check URL Configuration
- Look at Authentication > Logs

**"Real-time not updating"**
- Check RLS policies
- Verify WebSocket enabled (default)
- Check browser console for errors

**"Files not uploading"**
- Check `task-files` bucket exists
- Verify bucket is public
- Check storage policies

---

## NEXT STEPS

1. ✅ Complete this guide
2. Go back to project
3. Run `npm install @supabase/supabase-js`
4. Update `.env` with credentials
5. Run `npm start`
6. Test sign up
7. Deploy to Vercel

**You're all set!**

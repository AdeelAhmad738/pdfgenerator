# Supabase.com - Exact Actions You Need to Do

Your `.env` already has URL connected:
```
https://gcxmfwvuqbykpghebdfn.supabase.co
```

---

## ON SUPABASE.COM - DO THIS NOW

### ACTION 1: LOGIN & ACCESS PROJECT
1. Go to https://supabase.com
2. Login with your account
3. Click project: `gcxmfwvuqbykpghebdfn` (or your project name)
4. Wait for dashboard to load

### ACTION 2: RUN SQL SCHEMA (CRITICAL)
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open file in your project: `supabase-schema.sql`
4. Copy ALL the SQL code
5. Paste in Supabase SQL Editor
6. Click **Run** button
7. **WAIT** 2-3 minutes for tables to create
8. Check: No red error messages

**Result:** These tables created:
```
✅ tasks
✅ task_templates
✅ task_views
✅ task_invites
✅ task_drafts
✅ task_notifications
✅ task_activity
✅ task_attachments
```

### ACTION 3: CREATE STORAGE BUCKET
1. Click **Storage** (left sidebar)
2. Click **Create new bucket** (or **New Bucket**)
3. Name: `task-files`
4. **Check:** "Make it public" checkbox
5. Click **Create**

**Result:** File upload bucket ready

### ACTION 4: ENABLE EMAIL AUTHENTICATION
1. Click **Authentication** (left sidebar)
2. Click **Providers**
3. Find **Email**
4. Toggle it **ON** (should be already on)
5. Keep default settings

**Result:** Users can sign up with email

### ACTION 5: SET URL CONFIGURATION
1. Click **Authentication** (left sidebar)
2. Click **URL Configuration** (under Settings)
3. Find **Site URL**
4. Set to: `http://localhost:3000`
5. Click **Save**

**Result:** Login redirect works locally

### ACTION 6: VERIFY EVERYTHING CREATED
1. Click **Database** (left sidebar)
2. Click **Tables**
3. Verify you see all 8 tables:
   ```
   ✅ tasks
   ✅ task_templates
   ✅ task_views
   ✅ task_invites
   ✅ task_drafts
   ✅ task_notifications
   ✅ task_activity
   ✅ task_attachments
   ```

---

## IN YOUR PROJECT - DO THIS NEXT

### ACTION 7: INSTALL PACKAGE
```powershell
npm install @supabase/supabase-js
```

### ACTION 8: VERIFY `.env` FILE
Your `.env` should already have:
```env
REACT_APP_SUPABASE_URL=https://gcxmfwvuqbykpghebdfn.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_INVITE_FUNCTION_URL=https://gcxmfwvuqbykpghebdfn.supabase.co/functions/v1/send-invite-email
```

**If missing:** Get from Supabase > Settings > API

### ACTION 9: VERIFY SERVICE FILES EXIST
Check these files in your project:
```
✅ src/services/supabaseClient.js
✅ src/services/supabaseTasks.js
✅ src/services/supabaseExtras.js
✅ src/services/migration.js
```

All should already exist in your project.

### ACTION 10: TEST LOCALLY
```powershell
npm start
```

Open browser → http://localhost:3000

Try:
1. Click "Sign up"
2. Enter email: `test@example.com`
3. Enter password: `password123`
4. Click "Create account"
5. Go to Supabase > Authentication > Users
6. **Verify:** Your user appears there ✅

### ACTION 11: TEST BASIC FEATURES
If sign up worked:
1. Login with your account
2. Create a task
3. Go to Supabase > Database > tasks table
4. **Verify:** Your task appears there ✅

---

## REMAINING THINGS TO DO

### After Local Testing Works:

1. **Deploy to Vercel:**
   ```powershell
   git add -A; git commit -m "Complete Supabase integration"; git push origin master
   ```

2. **Update Supabase URL Configuration:**
   - Supabase > Authentication > URL Configuration
   - Change Site URL from `http://localhost:3000`
   - To: `https://yourapp.vercel.app` (after Vercel deployment)

3. **Add Email Service (Optional but Recommended):**
   - Use Resend or SendGrid
   - Create Edge Function: `send-invite-email`
   - Get API key from email provider

4. **Enable Monitoring (Optional):**
   - Supabase > Logs
   - Monitor database activity
   - Check Edge Function logs

---

## QUICK SUMMARY

| Step | Where | What to Do | Status |
|------|-------|-----------|--------|
| 1 | Supabase.com | Run SQL schema | ⏳ DO THIS NOW |
| 2 | Supabase.com | Create storage bucket | ⏳ DO THIS NOW |
| 3 | Supabase.com | Enable email auth | ⏳ DO THIS NOW |
| 4 | Supabase.com | Set URL config | ⏳ DO THIS NOW |
| 5 | Supabase.com | Verify tables exist | ⏳ DO THIS NOW |
| 6 | Your Project | `npm install @supabase/supabase-js` | ⏳ DO THIS NOW |
| 7 | Your Project | `npm start` | ⏳ DO THIS NOW |
| 8 | Your Project | Test sign up | ⏳ DO THIS NOW |
| 9 | GitHub | Push code | After testing |
| 10 | Vercel | Deploy | After push |
| 11 | Supabase.com | Update Site URL | After Vercel deploy |

---

## URL YOU'RE CONNECTED TO

```
Your Supabase Project: gcxmfwvuqbykpghebdfn
URL: https://gcxmfwvuqbykpghebdfn.supabase.co
Login: https://supabase.com (your email)
```

**Everything needed is in this URL.**

---

**NEXT:** Do Actions 1-6 on Supabase.com right now, then Actions 7-8 in your project.

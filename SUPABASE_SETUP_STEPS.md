# Supabase Complete Setup - Step by Step

## 1. CREATE SUPABASE PROJECT
1. Go to https://supabase.com
2. Sign up → Create new project
3. Name: `pdfgenerator`
4. Password: Create strong password
5. Region: Choose closest to users
6. Wait 5-10 minutes

## 2. GET CREDENTIALS
- Go to Settings > API
- Copy Project URL
- Copy `anon public` key
- Copy RLS policies SQL from `supabase-schema.sql`

## 3. CONFIGURE `.env`
```env
REACT_APP_SUPABASE_URL=your_url_here
REACT_APP_SUPABASE_ANON_KEY=your_key_here
REACT_APP_INVITE_FUNCTION_URL=https://your-project.supabase.co/functions/v1/send-invite-email
```

## 4. INSTALL PACKAGE
```powershell
npm install @supabase/supabase-js
```

## 5. INIT SUPABASE CLIENT
**File:** `src/services/supabaseClient.js`
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)
```

## 6. CREATE DATABASE SCHEMA
- Go to Supabase > SQL Editor
- Copy ALL SQL from `supabase-schema.sql`
- Run it
- All tables created automatically

## 7. IMPLEMENT AUTHENTICATION
- Sign up → `src/pages/auth/Signup.jsx`
- Login → `src/pages/auth/Login.jsx`
- Password reset → `src/pages/auth/Login.jsx` + `UpdatePassword.jsx`
- Protect routes → `src/components/ProtectedRoute.jsx`

## 8. IMPLEMENT TASK CRUD
- Create → `src/services/supabaseTasks.js` + `CreateTask.jsx`
- Read → `fetchTasks()` + `MyTasks.jsx`
- Update → `updateTask()` in TaskContext
- Delete → `deleteTask()` in TaskContext

## 9. IMPLEMENT INVITES & COLLABORATION
- `src/services/supabaseExtras.js` - `createInvite()`, `fetchInvites()`, `updateInviteStatus()`
- `src/pages/dashboard/Collaboration.jsx` - Display invites

## 10. IMPLEMENT NOTIFICATIONS
- `createNotificationWithAction()` in supabaseExtras.js
- `fetchNotifications()`, `markNotificationRead()`
- `src/pages/notifications/Notifications.jsx` - Display

## 11. IMPLEMENT FILE UPLOADS
- `uploadAttachment()` in supabaseExtras.js
- Storage bucket: `task-files`
- `fetchAttachments()`, `deleteAttachment()`

## 12. IMPLEMENT REAL-TIME
- `src/context/TaskContext.jsx` - Subscribe to postgres_changes
- Listen to INSERT, UPDATE, DELETE on tasks table

## 13. TEST LOCALLY
```powershell
npm start
```
- Sign up
- Create task
- Assign to another user
- Accept/decline invite
- Upload file
- See real-time updates

## 14. DEPLOY TO VERCEL
```powershell
git add -A; git commit -m "feat: complete Supabase integration"; git push origin master
```

---

**All 14 features implemented in sequential order.**

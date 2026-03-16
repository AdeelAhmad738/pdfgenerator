# Quick Start: Notification System

## 🚀 5-Minute Setup

### Step 1: Supabase SQL (Run Once)
```sql
-- Copy entire supabase-schema.sql content and run in Supabase SQL Editor
-- This creates all tables with RLS policies
```

### Step 2: Environment Variables
Add to `.env`:
```env
REACT_APP_INVITE_FUNCTION_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-invite-email
```

### Step 3: Function Secrets
Go to **Supabase** → **Functions** → **send-invite-email** → **Configuration**

Add secrets:
```
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 4: Enable Realtime
In Supabase Dashboard:
- **Database** → **Replication**
- Turn ON for:
  - `task_notifications`
  - `task_invites`
  - `task_activity`

### Step 5: Test!
1. Login as User A
2. Create task & assign to User B's email
3. Login as User B
4. Go to **Collaboration** → accept/decline invite
5. Check **Notifications** page

---

## ✨ Features Now Available

### **User A (Task Creator)**
- ✅ Create tasks and assign to teammates
- ✅ See acceptance/decline notifications
- ✅ View activity log of who accepted
- ✅ Edit tasks and notify assignees
- ✅ Track all team activities

### **User B (Assignee)**
- ✅ Receive task assignments (email + app notification)
- ✅ Accept or Decline tasks from **Collaboration** page
- ✅ View all pending invites
- ✅ See task details and activity
- ✅ Edit accepted tasks
- ✅ Get real-time notifications

### **Both Users**
- ✅ Real-time task updates
- ✅ Activity feed shows all changes
- ✅ Email notifications for important events
- ✅ Accept/Decline buttons for invitations
- ✅ Task detail view with full history

---

## 📍 Where to Find Features

| Feature | Location |
|---------|----------|
| **Create Task** | Dashboard → "Create Task" button |
| **Assign Task** | Create/Edit Task → "Assigned to" field |
| **View Invites** | Collaboration → "Pending Invites" section |
| **Accept/Decline** | Collaboration → Click "Accept" or "Decline" |
| **Task Details** | Click any task → Shows everything |
| **Activity Log** | Task Detail → "Activity" section |
| **Notifications** | Top navbar → Bell icon |
| **All Invites** | Collaboration → Shows sent & received |

---

## 🎯 Example Workflow

### **Scenario: Alice assigns task to Bob**

1. **Alice** creates task "Design Homepage"
2. **Alice** assigns to `bob@email.com`
3. ✉️ **Email sent** to Bob with task details
4. 🔔 **Bob receives notification** in app
5. **Bob** goes to **Collaboration** page
6. **Bob** sees invite and clicks **"Accept"**
7. 📢 **Alice gets notification** "Bob accepted the task"
8. **Bob** can now edit the task
9. When **Bob updates** the task:
   - Activity log shows the change
   - **Alice is notified** of the update
   - **Bob can see** Alice's response

---

## 🧪 Testing Checklist

- [ ] Email received when task is assigned
- [ ] Notification appears immediately in app
- [ ] Accept button works in Collaboration
- [ ] Decline button works
- [ ] Task becomes active after accepting
- [ ] Activity log shows all changes
- [ ] Notifications appear in real-time
- [ ] Edit task updates activity log
- [ ] Both users see updates

---

## 🔑 Key Points

✅ **Notifications are real-time** - Updates appear instantly without refresh  
✅ **Emails are sent** - Via Resend API with professional templates  
✅ **Activity tracked** - Every change is logged with actor and timestamp  
✅ **Accept/Decline workflow** - Invites must be accepted before task is active  
✅ **Two-way notifications** - Both creator and assignee are kept updated  

---

## 🛠️ If Something Doesn't Work

### Notifications not appearing?
1. Check **Realtime is enabled** for `task_notifications` in Supabase
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Refresh page: `F5`

### Emails not received?
1. Check **Resend dashboard** for failed deliveries
2. Verify **RESEND_API_KEY** is in Function secrets
3. Check **RESEND_FROM_EMAIL** is from verified domain

### Accept button doesn't work?
1. Make sure email matches your login email
2. Check **task_invites RLS policies** in Supabase
3. Verify **to_email** field is populated

### Activity not showing?
1. Ensure `logActivity()` calls are in TaskContext
2. Check **task_activity** table has realtime enabled
3. Verify you have permission (creator or assignee)

---

## 📚 Files Modified

- `src/context/TaskContext.jsx` - Added realtime subscriptions
- `src/pages/dashboard/MyTasks.jsx` - Added invite accept/decline UI
- `src/pages/dashboard/TaskDetail.jsx` - New file with full task management
- `src/pages/dashboard/Collaboration.jsx` - Enhanced invite handling
- `src/App.js` - Added TaskDetail route
- `supabase/functions/send-invite-email/index.ts` - Email service

---

Done! Your notification system is ready. 🎉

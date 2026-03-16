# Notification System Setup Guide

## Overview
This document explains how to set up and configure the notification system for task assignments, invitations, and activity tracking.

---

## ✅ What's Already Done

### 1. **Database Tables** (Already in supabase-schema.sql)
- ✅ `task_notifications` - Stores notifications
- ✅ `task_invites` - Stores collaboration & task invites
- ✅ `task_activity` - Tracks all task activities
- ✅ Row-level security (RLS) policies configured

### 2. **Email Service** (Configured)
- ✅ Supabase Edge Function: `send-invite-email`
- ✅ Uses Resend API for email delivery
- ✅ Professional HTML templates

### 3. **Frontend Features** (Implemented)
- ✅ Real-time notification subscriptions
- ✅ Accept/Decline task invites
- ✅ Activity feed showing all changes
- ✅ Collaboration management page
- ✅ Task detail view with acceptance workflow

---

## 📋 What You Need to Add to Supabase

### Step 1: Run the Schema (If Not Already Done)

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and paste the entire content from `supabase-schema.sql` and execute it.

This creates all required tables with proper RLS policies.

---

### Step 2: Set Up Email Function Secrets

1. Go to **Supabase Dashboard** → **Functions** → **send-invite-email**
2. Click **Configuration** → **Secrets**
3. Add these 2 secrets:

```
RESEND_API_KEY = <your_resend_api_key>
RESEND_FROM_EMAIL = <your_verified_domain_email>
```

**How to get these:**
- **RESEND_API_KEY**: Go to https://resend.com → Dashboard → API Keys → Create new key
- **RESEND_FROM_EMAIL**: Go to Resend → Domains → Use your verified domain (e.g., `noreply@yourdomain.com`)

---

### Step 3: Enable Realtime for Notifications

1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Enable realtime for these tables:
   - `task_notifications` ✅
   - `task_invites` ✅
   - `task_activity` ✅

This allows the app to receive real-time updates when notifications are created.

---

### Step 4: Set Up Environment Variable in Frontend

Update your `.env` file:

```env
REACT_APP_INVITE_FUNCTION_URL=https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-invite-email
```

Replace `YOUR_PROJECT_ID` with your Supabase project ID.

---

## 🔄 How the Notification Flow Works

### **When User A Assigns a Task to User B:**

1. ✅ Task is created with `assigned_to_email = userB@email.com`
2. ✅ Invite record is created in `task_invites` table
3. ✅ Email is sent via Resend API
4. ✅ Notification appears in User B's notifications
5. ✅ User B sees **Accept/Decline** buttons in task detail

### **When User B Accepts/Declines:**

1. ✅ Invite status is updated to `accepted` or `declined`
2. ✅ Notification is sent to User A about the response
3. ✅ Task assignment status updates accordingly
4. ✅ Activity log records the action

### **Task Updates & Collaboration:**

1. ✅ User A updates/edits a task
2. ✅ Activity log records the change
3. ✅ Assigned user (User B) can view activity in task detail
4. ✅ Notification sent to both users about the update

---

## 🎯 Feature Breakdown

### **Pending Task Invites** (Collaboration Page)
- Shows invites User B received
- **Accept** button - Task becomes active for User B
- **Decline** button - Task is declined, User A is notified

### **Task Detail View**
- Shows **Accept/Decline** banner if invite is pending
- Edit button to modify task (if you're owner or assignee)
- **Activity Feed** tab showing all changes:
  - When task was created
  - When it was assigned
  - When assigned user accepted
  - All edits/updates made by anyone
  - Status changes

### **Notifications Page**
- Real-time notifications from all events
- Filter by **All** or **Unread**
- Direct action buttons to navigate to relevant tasks/collaboration

### **Collaboration Page**
- **Team Workload** - See task distribution
- **Pending Invites** - Accept/Decline invitations
- **Invite Teammate** - Send new invites
- **Sent Invites** - Track your sent invitations
- **Shared Tasks** - View all assigned tasks with filters

---

## 🧪 Testing the System

### **Test 1: Task Assignment**
1. User A: Create a new task
2. User A: Assign to `userb@email.com`
3. ✅ Email sent to User B
4. Check User B's **Notifications** - should show new assignment

### **Test 2: Accept/Decline**
1. User B: Go to **Collaboration** → **Pending Invites**
2. User B: Click **Accept** or **Decline**
3. ✅ Status updates in real-time
4. User A: Check **Notifications** - should see response
5. Check task **Activity** - shows acceptance

### **Test 3: Edit Task**
1. User A (or assignee): Open task detail
2. Click **Edit** button
3. Change title/description
4. Click **Update Task**
5. ✅ Activity feed shows the update
6. ✅ Both users receive notification of change

### **Test 4: Real-time Updates**
1. Open task in 2 browsers (User A and User B)
2. User A edits task
3. ✅ User B's page updates automatically
4. ✅ Activity appears in real-time

---

## 📊 Database Schema Details

### `task_invites` Table
```
- id: uuid
- user_id: uuid (creator)
- from_user_id: uuid (sender)
- from_email: text
- to_email: text (recipient)
- invite_type: 'collaboration' | 'task'
- task_id: uuid (for task invites)
- status: 'pending' | 'accepted' | 'declined'
- created_at: timestamp
```

### `task_notifications` Table
```
- id: uuid
- user_id: uuid (recipient)
- title: text (e.g., "Task assigned")
- message: text
- action_link: text (e.g., "/dashboard/tasks/123")
- action_label: text (e.g., "Open task")
- task_id: uuid
- time: timestamp
- read: boolean
```

### `task_activity` Table
```
- id: uuid
- task_id: uuid
- actor_id: uuid
- actor_email: text
- action: text (e.g., "created", "updated", "comment")
- details: jsonb (any extra info)
- created_at: timestamp
```

---

## 🔐 RLS Policies (Already Set Up)

- Users can only see their own notifications
- Users can accept/decline invites sent to them
- Task activity visible to creator and assignee
- Invites visible to sender and recipient

---

## ❌ Common Issues & Fixes

### **"Email not being sent"**
- ✅ Check `RESEND_API_KEY` is set in Function secrets
- ✅ Check `RESEND_FROM_EMAIL` is from a verified domain
- ✅ Check email validation in the function

### **"Notifications not appearing"**
- ✅ Make sure `task_notifications` table has realtime enabled
- ✅ Check your user ID is correct in the database
- ✅ Clear browser cache and refresh

### **"Can't accept/decline invites"**
- ✅ Make sure invite email matches your login email
- ✅ Check `task_invites` RLS policies
- ✅ Verify `to_email` field is populated

### **"Activity not showing"**
- ✅ Make sure `logActivity()` is being called in TaskContext
- ✅ Check you have proper RLS permissions
- ✅ Verify `task_activity` table has correct data

---

## 🚀 Next Steps

1. **Run SQL schema** in Supabase
2. **Enable realtime** for the 3 tables
3. **Set environment secrets** in Function
4. **Update .env** with function URL
5. **Test the flow** with 2 user accounts
6. **Monitor** email delivery via Resend dashboard

---

## 📞 Support

If notifications aren't working:
1. Check browser console for errors
2. Check Supabase function logs
3. Check Resend dashboard for email delivery status
4. Verify RLS policies are correct
5. Check realtime is enabled on tables

All code is already integrated! Just follow the setup steps above. ✨

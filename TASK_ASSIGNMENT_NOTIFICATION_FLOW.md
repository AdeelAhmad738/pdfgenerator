# Task Assignment & Notification System - Complete Guide

## WHAT YOU WANT

**Flow:**
1. User A assigns task to User B (enters User B's email)
2. User B receives **in-app notification** (on site)
3. User B receives **email notification** (inbox)
4. User B sees "Accept" & "Decline" buttons
5. User B accepts/declines task
6. User A gets notified of User B's response

**Same flow for collaboration invites**

---

## CURRENT SYSTEM STATUS

✅ **This functionality ALREADY EXISTS** in your code!

Files involved:
- `src/services/supabaseExtras.js` - Invites & notifications
- `src/context/TaskContext.jsx` - Task assignment logic
- `src/pages/dashboard/Collaboration.jsx` - Accept/Decline UI
- `.env` - Email function endpoint

---

## HOW IT WORKS - STEP BY STEP

### FLOW DIAGRAM

```
User A (Task Creator)
        ↓
  Assigns task to User B's email
        ↓
  Creates "task_invites" record
        ↓
  Creates in-app notification
        ↓
  Sends email via Edge Function
        ↓
  ↙              ↘
User B            User B
(In-app)          (Email)
Sees invite       Clicks link
notification      in email
        ↓          ↓
Both lead to same page: Collaboration tab
        ↓
User B clicks:
"Accept" or "Decline"
        ↓
Task status updates
        ↓
User A gets notified
of response
```

---

## FILES & THEIR ROLES

### 1. Task Assignment Entry Point
**File:** `src/pages/dashboard/CreateTask.jsx`

User A:
- Creates task form
- Enters "Assigned to" email (User B's email)
- Clicks "Create Task"

```javascript
const handleCreateTask = async (formData) => {
  // formData contains: { title, description, assignedTo: "userB@email.com", ... }
  await addTask(formData)
}
```

### 2. Assignment Logic
**File:** `src/context/TaskContext.jsx`

Function: `addTask()` (line ~400)

```javascript
const addTask = useCallback(
  async ({ title, description, assignedTo, ... }) => {
    const normalizedAssigned = assignedTo.trim()
    
    // Create the task
    const newTask = await createTaskInDb(newTask)
    
    // If assigned to someone else (not self)
    if (normalizedAssigned !== currentUserEmail) {
      
      // Step 1: Create INVITE record
      const invite = await createInvite({
        toEmail: normalizedAssigned,
        inviteType: "task",
        taskId: newTask.id,
        taskTitle: newTask.title,
        taskPriority: newTask.priority,
        taskDeadline: newTask.deadline
      })
      
      // Step 2: Create IN-APP NOTIFICATION
      addNotification({
        title: "Task assignment sent",
        message: `Assignment request sent to ${normalizedAssigned}.`,
        actionLink: "/dashboard/collaboration",
        actionLabel: "View invites"
      })
      
      // Step 3: Send EMAIL NOTIFICATION
      await sendInviteEmail({
        to: normalizedAssigned,
        subject: `You've been assigned a task: ${newTask.title}`,
        message: `A new task has been assigned to you: "${newTask.title}". Please accept or decline.`
      })
    }
  }
)
```

### 3. Invite Service Functions
**File:** `src/services/supabaseExtras.js`

**Function A: Create Invite**
```javascript
export const createInvite = async (payload) => {
  // Creates record in task_invites table
  // Record includes: from_user_id, to_email, task_id, status: "pending"
  const { data, error } = await supabase
    .from("task_invites")
    .insert([insertPayload])
    .select()
    .single()
  return data
}
```

**Function B: Create Notification**
```javascript
export const createNotificationWithAction = async ({
  userId, title, message, actionLink, actionLabel, taskId
}) => {
  // Creates record in task_notifications table
  const { data, error } = await supabase
    .from("task_notifications")
    .insert([payload])
    .select()
    .single()
  return data
}
```

**Function C: Send Email**
```javascript
export const sendInviteEmail = async ({ to, subject, message }) => {
  const endpoint = process.env.REACT_APP_INVITE_FUNCTION_URL
  
  // Calls Supabase Edge Function
  await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, message })
  })
}
```

### 4. User B - Receives Notifications
**In-App:** Supabase > task_notifications table
- Appears in bell icon notification dropdown
- Shows: "Task assignment sent"
- Has action link: "/dashboard/collaboration"

**Email:** Sent via Edge Function
- Subject: "You've been assigned a task: {task_name}"
- Contains task details
- May have action link (if Edge Function configured)

### 5. User B - Reviews & Accepts/Declines
**File:** `src/pages/dashboard/Collaboration.jsx`

User B sees:
```
Pending Invites
├─ From: User A
├─ Task: "Complete Report"
├─ Priority: High
├─ Deadline: 2024-03-20
└─ Buttons:
   [Accept] [Decline]
```

Code:
```javascript
const handleRespondToInvite = async (invite, status) => {
  // status = "accepted" or "declined"
  await respondToInvite(invite, status)
  
  // Updates task_invites.status
  // Updates task assignment_status
  // Notifies User A of response
}
```

### 6. Database Tables Involved

**task_invites Table:**
```sql
id, user_id, from_user_id, from_email, to_email, 
invite_type, task_id, task_title, task_priority, 
task_deadline, status (pending/accepted/declined)
```

**task_notifications Table:**
```sql
id, user_id, title, message, action_link, action_label, 
task_id, time, read (boolean)
```

**tasks Table:**
```sql
... assigned_to_email, assignment_status (active/pending/declined) ...
```

---

## CURRENT STATUS: WHAT'S WORKING

✅ Task creation with assignment
✅ Invite record creation
✅ In-app notification creation
✅ Email sending (via Edge Function)
✅ Accept/Decline buttons
✅ Status update on response

---

## WHAT NEEDS CONFIGURATION

### 1. Email Service (Edge Function)

Currently, email function URL is set but may not be fully configured.

**File:** `.env`
```
REACT_APP_INVITE_FUNCTION_URL=https://gcxmfwvuqbykpghebdfn.supabase.co/functions/v1/send-invite-email
```

**To Enable Emails:**

Option A: Use Resend (Easiest)
```javascript
// In Supabase Edge Function
import { Resend } from "npm:resend@latest";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const { to, subject, message } = await req.json();

  const { data, error } = await resend.emails.send({
    from: "noreply@yourdomain.com",
    to: to,
    subject: subject,
    html: `<p>${message}</p>`
  });

  return new Response(
    JSON.stringify({ success: !error, error }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

Option B: Use SendGrid
```javascript
const sg = require("sendgrid")(Deno.env.get("SENDGRID_API_KEY"));

// ... send email via SendGrid
```

---

## TEST THE FLOW

### Test Setup

**User A account:** `userA@gmail.com`
**User B account:** `userB@gmail.com`

### Test Steps

1. **Login as User A**
   ```
   Email: userA@gmail.com
   Password: (your password)
   ```

2. **Go to Dashboard > Create Task**
   - Title: "Review Report"
   - Description: "Please review the quarterly report"
   - Assigned to: `userB@gmail.com`
   - Priority: High
   - Click "Create Task"

3. **Check User A's Notifications** (Bell icon)
   - Should see: "Task assignment sent to userB@gmail.com"

4. **Check Supabase Database**
   - Go to Supabase > task_invites table
   - Should see new record with:
     - to_email: userB@gmail.com
     - task_title: "Review Report"
     - status: pending

5. **Check User B's Email** (check spam folder)
   - Should receive email with subject: "You've been assigned a task: Review Report"
   - May take 1-2 minutes

6. **Login as User B**
   ```
   Email: userB@gmail.com
   Password: (user B's password)
   ```

7. **Check User B's Notifications** (Bell icon)
   - Should see: "Task assignment sent"
   - Click action link or go to Dashboard > Collaboration

8. **View in Collaboration Tab**
   - Go to Dashboard > Collaboration
   - Under "Pending Invites" section
   - See task from User A with:
     - Task title: "Review Report"
     - Priority: High
     - [Accept] [Decline] buttons

9. **User B Accepts Task**
   - Click "Accept" button
   - Task now appears in User B's "My Tasks"
   - assignment_status changes from "pending" to "active"

10. **User A Gets Notified**
    - Login as User A
    - Check notifications (bell icon)
    - Should see: "You accepted the Review Report invite"

---

## COMPLETE FLOW SUMMARY

| Step | Who | What Happens | Database |
|------|-----|-------------|----------|
| 1 | User A | Creates task, assigns to User B | tasks table created |
| 2 | System | Creates invite record | task_invites created |
| 3 | System | Creates in-app notification | task_notifications created |
| 4 | System | Sends email | (via Edge Function) |
| 5 | User B | Receives in-app notification | notification appears |
| 6 | User B | Receives email | email in inbox |
| 7 | User B | Clicks Accept/Decline | task_invites.status updated |
| 8 | System | Updates task status | tasks.assignment_status updated |
| 9 | User A | Gets notified of response | task_notifications created |

---

## COLLABORATION INVITES (Same Flow)

When User A invites User B to collaborate:

**File:** `src/context/TaskContext.jsx` > `addInvite()` function

```javascript
const addInvite = useCallback(
  async (email) => {
    // Step 1: Create invite
    const invite = await createInvite({
      toEmail: email,
      inviteType: "collaboration"  // ← Different type
    })
    
    // Step 2: Notify User A
    addNotification({
      title: "Collaboration invite sent",
      message: `Invitation sent to ${email}.`
    })
    
    // Step 3: Send email
    await sendInviteEmail({
      to: email,
      subject: "You're invited to collaborate",
      message: "You have been invited to a task workspace."
    })
  }
)
```

User B:
- Receives same notifications
- Can accept/decline in Collaboration tab
- Gets added to workspace on accept

---

## CHECKLIST

### Configuration
- [ ] `.env` has `REACT_APP_INVITE_FUNCTION_URL` set
- [ ] Email service configured (Resend, SendGrid, etc.)
- [ ] Supabase Edge Function created and deployed
- [ ] Email API key added to Supabase Secrets

### Testing
- [ ] Created 2 test accounts (User A & User B)
- [ ] User A assigned task to User B
- [ ] User A sees notification
- [ ] Task recorded in task_invites table
- [ ] User B receives email (check spam folder)
- [ ] User B sees in-app notification
- [ ] User B clicks Accept
- [ ] Task appears in User B's tasks
- [ ] User A gets notified of acceptance

---

## IF EMAILS NOT SENDING

### Troubleshooting

1. **Check Edge Function Logs:**
   - Supabase > Edge Functions
   - Click `send-invite-email`
   - Go to **Logs** tab
   - Look for error messages

2. **Check Email Service:**
   - Did you add API key to Supabase Secrets?
   - Is API key valid?
   - Is email service account configured?

3. **Check Function Code:**
   - Resend configured?
   - SendGrid configured?
   - Returns proper response?

4. **Test Function Directly:**
   - Supabase > Edge Functions
   - Click `send-invite-email`
   - Click **Invoke**
   - Send test request with valid email
   - Check response

---

## SUMMARY

✅ **System already handles:**
- Task assignment
- In-app notifications
- Email notifications
- Accept/Decline buttons
- Collaboration invites
- Status tracking

⚠️ **You need to configure:**
- Email service (Resend/SendGrid)
- Supabase Edge Function
- API key in secrets
- Test with 2 accounts

**Next Step:** Configure email service and test the full flow!

# Fix: Bucket Not Found Error on Profile Picture Upload

## THE PROBLEM

Your code tries to upload to bucket: `avatars`

But you only created bucket: `task-files`

**Error:** Bucket "avatars" doesn't exist ❌

---

## SOLUTION - Choose One:

### Option A: Create "avatars" Bucket (RECOMMENDED)

**On Supabase.com:**

1. Go to **Storage** (left sidebar)
2. Click **Create new bucket** (or **New Bucket**)
3. Enter name: `avatars`
4. **Check:** "Make it public" checkbox ✅
5. Click **Create**

**Result:** Bucket `avatars` created and public ✅

**Then test again:** Upload profile picture → Should work!

---

### Option B: Change Code to Use "task-files" Bucket

**File:** `src/pages/profile/Profile.jsx`

Find this line (~111):
```javascript
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(filePath, file)
```

Change `avatars` to `task-files`:
```javascript
const { error: uploadError } = await supabase.storage
  .from("task-files")  // ← Changed from "avatars"
  .upload(filePath, file)
```

Also find this line (~116):
```javascript
const { data } = supabase.storage
  .from("avatars")
  .getPublicUrl(filePath)
```

Change to:
```javascript
const { data } = supabase.storage
  .from("task-files")  // ← Changed from "avatars"
  .getPublicUrl(filePath)
```

**Result:** Profile pictures upload to `task-files` bucket instead ✅

---

## WHICH OPTION TO CHOOSE?

| Option | Pros | Cons |
|--------|------|------|
| **A: Create avatars bucket** | Organized, separate buckets | One more bucket |
| **B: Use task-files** | Simpler, one bucket | Mixed file types |

**Recommendation:** **Option A** - Create `avatars` bucket (cleaner organization)

---

## HOW TO DO OPTION A (STEP-BY-STEP)

### Step 1: Login to Supabase
- Go to https://supabase.com
- Click your project

### Step 2: Go to Storage
- Click **Storage** (left sidebar)

**Screen:** Shows your existing bucket `task-files`

### Step 3: Create New Bucket
- Click **Create new bucket** (top right)
- Or click **New Bucket** button

**Screen:** Form appears

### Step 4: Fill Form
```
Bucket name: avatars
[checkbox] Make it public  ← CHECK THIS
```

### Step 5: Create
- Click **Create** button
- Wait 1-2 seconds

**Screen:** You see both buckets:
```
✅ task-files (public)
✅ avatars (public)
```

---

## TEST IT

After creating `avatars` bucket:

1. Go to your app: http://localhost:3000
2. Login
3. Go to **Profile** page
4. Click camera icon on avatar
5. Select image file
6. **Should upload now** ✅

If still error:
- Check browser console (F12)
- Check Supabase > Logs > Storage tab
- Look for error message

---

## BUCKETS YOU NEED

| Bucket Name | Purpose | Already Created? |
|-------------|---------|------------------|
| `task-files` | Task attachments, documents | ✅ Yes |
| `avatars` | User profile pictures | ❌ No - CREATE THIS |

---

## QUICK SUMMARY

**Problem:** Code uploads to `avatars` bucket, but bucket doesn't exist

**Fix:** Create `avatars` bucket on Supabase.com in Storage

**How:** 
1. Supabase.com > Storage
2. Create new bucket
3. Name: `avatars`
4. Check: Make it public
5. Click Create

**Then:** Test profile picture upload again ✅

---

## STILL NOT WORKING?

Check these:

1. **Bucket is public?**
   - Supabase > Storage > avatars bucket
   - Should say "Public"

2. **RLS policies correct?**
   - This is automatic from `supabase-schema.sql`
   - Should allow public read, owner write

3. **Browser cache?**
   - Press Ctrl+Shift+R (hard refresh)
   - Or clear browser cache

4. **Check error logs:**
   - Open browser F12 (Dev Tools)
   - Go to Console tab
   - Upload file
   - Look for red error message
   - Copy error text

---

**DO THIS NOW:** Create `avatars` bucket on Supabase.com, then test!

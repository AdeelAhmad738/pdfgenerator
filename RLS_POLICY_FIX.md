# Fix: Row-Level Security (RLS) Policy Error on Avatar Upload

## THE PROBLEM

Error message:
```
new row violates row-level security policy
```

**Reason:** The `avatars` bucket exists, but has NO storage policies configured.

RLS blocks the upload because no policy says "allow this" ✗

---

## SOLUTION

You need to add storage policies for the `avatars` bucket.

---

## STEP-BY-STEP FIX

### Step 1: Go to Supabase SQL Editor
1. Open https://supabase.com
2. Click your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy This SQL

```sql
-- Storage policies for avatars bucket
create policy "Public read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "User write avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "User delete avatars" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid() = owner);
```

### Step 3: Paste in SQL Editor
- Paste the SQL code above into the query editor
- Click **Run** button
- Wait 1-2 seconds

**Result:** You see success message (no red errors)

---

## VERIFY IT WORKED

1. Go to **Storage** (left sidebar)
2. Click **avatars** bucket
3. Click **Policies** tab
4. You should see 3 policies:
   ```
   ✅ Public read avatars
   ✅ User write avatars
   ✅ User delete avatars
   ```

**If you see them:** Policies are created ✅

---

## TEST UPLOAD AGAIN

1. Go back to your app: http://localhost:3000
2. Go to **Profile** page
3. Click camera icon on avatar
4. Select image file
5. Try upload again

**Should work now!** ✅

---

## IF STILL NOT WORKING

### Try This Alternative (Emergency Fix)

If above doesn't work, disable RLS for avatars bucket:

1. Supabase > Storage
2. Click **avatars** bucket
3. Look for **RLS toggle** at top
4. Click toggle to turn RLS **OFF**

**Warning:** This makes avatars public write (less secure)

Only use if you can't fix the policies.

---

## WHAT HAPPENED

**Before:**
```
avatars bucket created
├─ RLS enabled ✓
└─ Policies: NONE ✗
   → Upload blocked!
```

**After Running SQL:**
```
avatars bucket
├─ RLS enabled ✓
└─ Policies:
   ├─ Public read ✓
   ├─ User write ✓
   └─ User delete ✓
   → Upload allowed!
```

---

## FULL POLICY EXPLANATION

| Policy | What it Does |
|--------|-------------|
| `Public read avatars` | Anyone can download/view avatars |
| `User write avatars` | Only owner (user who uploaded) can upload |
| `User delete avatars` | Only owner can delete their avatar |

---

## QUICK SUMMARY

**Problem:** avatars bucket has RLS but no policies

**Fix:** Run the 3 SQL policies above in Supabase SQL Editor

**Then:** Test profile picture upload again ✅

---

## CHECKLIST

- [ ] Opened Supabase.com
- [ ] Went to SQL Editor
- [ ] Created new query
- [ ] Pasted 3 policies SQL
- [ ] Clicked Run
- [ ] Verified 3 policies created
- [ ] Tested profile picture upload
- [ ] **Upload works!** ✅

---

**DO THIS NOW:** Run the SQL policies above, then test avatar upload again!

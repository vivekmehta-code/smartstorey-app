# SmartStorey App – Complete Setup Guide

A step-by-step guide for first-time setup.

---

## Part 1: Supabase (Database & Auth)

### Step 1.1: Create a Supabase account

1. Open your browser and go to **https://supabase.com**
2. Click **Start your project**
3. Sign up with GitHub or email
4. Verify your email if asked

### Step 1.2: Create a new project

1. After logging in, click **New Project**
2. Choose your **Organization** (or create one)
3. Fill in:
   - **Name**: `smartstorey` (or any name)
   - **Database Password**: Create a strong password and **save it somewhere**
   - **Region**: Pick one close to you
4. Click **Create new project**
5. Wait 1–2 minutes for the project to be ready

### Step 1.3: Get your API keys

1. In the left sidebar, click **Project Settings** (gear icon)
2. Click **API** in the left menu
3. You’ll see:
   - **Project URL** – copy it
   - **Project API keys** – copy the **anon public** key (not the service_role key)
4. Keep these somewhere safe; you’ll use them next

---

## Part 2: Add Keys to Your App

### Step 2.1: Open the project in Cursor

1. Open **Cursor**
2. Go to **File → Open Folder**
3. Choose: `Documents/SFMBA_Study/Cursor/smartstorey-app`
4. Click **Open**

### Step 2.2: Create the `.env.local` file

1. In the left sidebar (Explorer), right-click in the project root
2. Click **New File**
3. Name it exactly: `.env.local`
4. Open it and paste:

```
NEXT_PUBLIC_SUPABASE_URL=paste-your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

5. Replace `paste-your-project-url-here` with your Project URL
6. Replace `paste-your-anon-key-here` with your anon public key
7. Save the file (Cmd+S or Ctrl+S)

Example (with fake values):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Part 3: Run Database Migrations

### Step 3.1: Open the SQL Editor in Supabase

1. Go back to your browser and open **Supabase**
2. Open your project
3. In the left sidebar, click **SQL Editor**.

### Step 3.2: Run Migration 1

1. In Supabase SQL Editor, click **New query**
2. In Cursor, open: `supabase/migrations/001_create_requests_table.sql`
3. Select all (Cmd+A or Ctrl+A) and copy (Cmd+C or Ctrl+C)
4. In Supabase, paste into the query box
5. Click **Run** (or press Cmd+Enter)
6. Confirm you see “Success. No rows returned” (or similar)

### Step 3.3: Run Migration 2

1. In Supabase, click **New query**
2. In Cursor, open: `supabase/migrations/002_create_profiles_table.sql`
3. Select all (Cmd+A) and copy (Cmd+C)
4. In Supabase, paste into the query box
5. Click **Run**
6. Confirm it runs successfully

### Step 3.4: Run Migration 3

1. In Supabase, click **New query**
2. In Cursor, open: `supabase/migrations/003_reset_stale_claims.sql`
3. Select all (Cmd+A) and copy (Cmd+C)
4. In Supabase, paste into the query box
5. Click **Run**
6. Confirm it runs successfully

---

## Part 4: Disable Email Confirmation (for Testing)

1. In Supabase, click **Authentication** in the left sidebar
2. Click **Providers**
3. Click **Email**
4. Turn **OFF** the option “Confirm email”
5. Click **Save**

---

## Part 5: Start the App

### Step 5.1: Open the terminal in Cursor

1. In Cursor, go to **Terminal → New Terminal** (or press Ctrl+` or Cmd+`)
2. A terminal appears at the bottom

### Step 5.2: Start the dev server

1. In the terminal, type:

   ```bash
   npm run dev
   ```

2. Press Enter
3. Wait until you see something like: `✓ Ready in 372ms`
4. Note the URL shown (e.g. `http://localhost:3000`)

### Step 5.3: Open the app in the browser

1. Open Chrome (or another browser)
2. In the address bar, type: `http://localhost:3000`
3. Press Enter
4. You should see the SmartStorey home page

---

## Part 6: Create Test Users

1. On the home page, click **Test Setup**
2. Click **Create Payee**
3. Click **Create Requester**
4. Click **Sign in as Payee**
5. Click **Add ₹1000 to Payee balance**
6. Click **Create sample requests**

---

## Part 7: Test the App

### Test Payee

1. Click **Payee Dashboard** (or go to `http://localhost:3000/pay`)
2. You should see 3 pending requests
3. Click **Claim** on one
4. You’ll be redirected to a UPI URL (it may fail in the browser; that’s fine)
5. Use the browser **Back** button to return
6. Click **Confirm Payment** – balance should decrease

### Test Requester

1. Click **Test Setup**
2. Click **Sign in as Requester**
3. Click **New Request**
4. Click **Upload from Gallery** and choose an image with a UPI QR code (or use a sample from the web)
5. Choose a category
6. Click **Send Request**
7. You should see the “Waiting for Payee” screen

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| `Supabase not configured` | Check `.env.local` exists and has correct keys. Restart the dev server. |
| `Site cannot be reached` | Ensure `npm run dev` is running and the terminal shows “Ready”. |
| `Sign in failed` | Create user first, then sign in. Disable email confirmation in Supabase. |
| `Failed to create requests` | Run all migrations in Supabase. |
| `Port 3000 in use` | Try `http://localhost:3001` as shown in the terminal. |

---

## Quick Reference

| What | Where |
|------|-------|
| Project folder | `Documents/SFMBA_Study/Cursor/smartstorey-app` |
| App URL | http://localhost:3000 |
| Home | http://localhost:3000 |
| New Request | http://localhost:3000/requester |
| Payee Dashboard | http://localhost:3000/pay |
| Test Setup | http://localhost:3000/test-setup |

**Test logins**

- Payee: `payee@test.com` / `Test123!@#`
- Requester: `requester@test.com` / `Test123!@#`

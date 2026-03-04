# Testing Guide

## Prerequisites

1. **Supabase configured** – Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Migrations run** – Execute all SQL in `supabase/migrations/` in the Supabase SQL Editor (in order: 001, 002, 003).

3. **Email confirmation disabled** (optional, for easier testing):
   - Supabase Dashboard → Authentication → Providers → Email
   - Turn off "Confirm email"

## Test Setup Page

Go to **http://localhost:3000/test-setup** (or click "Test Setup" on the home page).

### Quick flow

1. **Create test users** – Click "Create Payee" and "Create Requester"
2. **Sign in as Payee** – Click "Sign in as Payee"
3. **Add balance** – Click "Add ₹1000 to Payee balance"
4. **Create sample requests** – Click "Create sample requests"
5. **Test Payee flow** – Go to Payee Dashboard → claim a request
6. **Test Requester flow** – Sign in as Requester → New Request → scan/upload QR → submit

### Test credentials

| Role     | Email              | Password   |
|----------|--------------------|------------|
| Payee    | payee@test.com     | Test123!@# |
| Requester| requester@test.com | Test123!@# |

## Manual testing (without Test Setup)

If you prefer to create users in Supabase Dashboard:

1. **Authentication → Users → Add user** – Create payee@test.com and requester@test.com
2. **SQL Editor** – Add balance and sample requests:
   ```sql
   -- Add balance (replace USER_ID with payee's uuid from Auth > Users)
   INSERT INTO profiles (id, preloaded_balance)
   VALUES ('USER_ID', 1000)
   ON CONFLICT (id) DO UPDATE SET preloaded_balance = 1000;

   -- Create sample requests
   INSERT INTO requests (category, upi_string, amount, status)
   VALUES 
     ('Food', 'upi://pay?pa=test@upi&am=150&cu=INR', 150, 'pending'),
     ('Auto travel', 'upi://pay?pa=test@upi&am=250&cu=INR', 250, 'pending');
   ```

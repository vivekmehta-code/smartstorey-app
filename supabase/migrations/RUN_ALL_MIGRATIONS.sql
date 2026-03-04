-- ============================================
-- SmartStorey: Run all migrations at once
-- Copy this entire file into Supabase SQL Editor and click Run
-- ============================================

-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== MIGRATION 1: Requests table ==========
CREATE TYPE expense_category AS ENUM (
  'Porter',
  'Hardware purchase',
  'Auto travel',
  'Food',
  'Others'
);

CREATE TABLE IF NOT EXISTS requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id uuid REFERENCES auth.users,
  category expense_category NOT NULL,
  upi_string text NOT NULL,
  amount decimal(10, 2),
  status text DEFAULT 'pending',
  claimant_id uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT now()
);

-- ========== MIGRATION 2: Profiles table ==========
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  preloaded_balance decimal(10, 2) DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, preloaded_balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== MIGRATION 3: Reset stale claims ==========
ALTER TABLE requests ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.reset_stale_claims()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE requests
  SET status = 'pending', claimant_id = NULL, claimed_at = NULL
  WHERE status = 'claimed'
    AND (claimed_at IS NULL OR claimed_at < (now() - interval '10 minutes'));

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_stale_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_stale_claims() TO anon;

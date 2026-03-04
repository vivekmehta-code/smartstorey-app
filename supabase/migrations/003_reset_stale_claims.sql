-- Add claimed_at to track when a request was claimed (for stale reset)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;

-- Safety Valve: Reset requests stuck in 'claimed' for more than 10 minutes
-- Call this via RPC from the client, or schedule with pg_cron

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

-- Grant execute to authenticated users and anon (for client-side call)
GRANT EXECUTE ON FUNCTION public.reset_stale_claims() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_stale_claims() TO anon;

-- Optional: Run every 5 minutes via pg_cron (enable extension in Supabase Dashboard first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('reset-stale-claims', '*/5 * * * *', $$SELECT public.reset_stale_claims()$$);

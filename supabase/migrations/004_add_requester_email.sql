-- Add requester_email so Payee Dashboard can show who requested the payment
ALTER TABLE requests ADD COLUMN IF NOT EXISTS requester_email text;

-- Create expense category enum
CREATE TYPE expense_category AS ENUM (
  'Porter',
  'Hardware purchase',
  'Auto travel',
  'Food',
  'Others'
);

-- Create requests table
CREATE TABLE requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id uuid REFERENCES auth.users,
  category expense_category NOT NULL,
  upi_string text NOT NULL,
  amount decimal(10, 2),
  status text DEFAULT 'pending',
  claimant_id uuid REFERENCES auth.users,
  created_at timestamp with time zone DEFAULT now()
);

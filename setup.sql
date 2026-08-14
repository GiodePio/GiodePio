-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  date text NOT NULL,
  tag text NOT NULL,
  color text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  subject text NOT NULL,
  status text DEFAULT 'open',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: Add some initial dummy data for updates if empty
INSERT INTO public.updates (version, date, tag, color, title, body)
VALUES 
  ('v1.3.0', '2026-08-13', 'New', '#22c55e', 'Pro Rank System', 'Pro rank is now fully integrated with Supabase. Admins can grant/revoke pro from the admin panel.'),
  ('v1.2.0', '2026-08-01', 'Feature', '#3b82f6', 'Leaderboard & +Rep', 'Added a global leaderboard tracking all captures per user, and a community +Rep system.')
ON CONFLICT DO NOTHING;

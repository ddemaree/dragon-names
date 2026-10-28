create table public.stories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  story text not null,
  -- Story customization choices (character kind, tone, setting, ...)
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Only the server (secret key) reads and writes stories; no public policies
alter table public.stories enable row level security;

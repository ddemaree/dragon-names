-- Storytelling mode: a story built turn by turn with a young writer
create table public.tales (
  id uuid primary key default gen_random_uuid(),
  -- The hero the story is about: { kind, name, type }
  hero jsonb not null,
  -- Ordered parts: { connector, idea, ideaSource, text }
  parts jsonb not null default '[]'::jsonb,
  finished boolean not null default false,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only the server (secret key) reads and writes tales; no public policies
alter table public.tales enable row level security;

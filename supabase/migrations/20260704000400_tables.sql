-- Hemingway :: tables
-- Every table carries id (uuid), created_at, updated_at per docs/data-model.md.
--
-- EMBEDDING DIMENSION: 1024, matching the llm provider `embed` output (Voyage
-- voyage-3.5 / voyage-3-large, Anthropic's recommended embedding model). This
-- value appears here (journalists.profile_embedding, articles.embedding) and in
-- the match_journalists() signature. Changing the embedding model means changing
-- BOTH and re-embedding every row.

-- publications -------------------------------------------------------------
create table publications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  website text not null,
  vertical vertical not null,
  tier publication_tier not null,
  scrape_config jsonb not null default '{}'::jsonb,
  last_scraped_at timestamptz
);

-- journalists --------------------------------------------------------------
create table journalists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  publication_id uuid not null references publications (id) on delete cascade,
  name text not null,
  role text,
  email text,
  email_status email_status not null default 'unverified',
  email_verified_at timestamptz,
  beat_summary text,
  receptivity_notes text,
  quotes_founders boolean not null default false,
  uses_data_studies boolean not null default false,
  profile_embedding vector(1024),
  last_profiled_at timestamptz
);

-- articles -----------------------------------------------------------------
create table articles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  journalist_id uuid not null references journalists (id) on delete cascade,
  title text not null,
  url text not null,
  published_at timestamptz,
  summary text,
  embedding vector(1024)
);

-- clients ------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  website text,
  vertical vertical not null,
  sending_domain text,
  sending_domain_status sending_domain_status not null default 'not_setup',
  knowledge_base text,
  active boolean not null default true
);

-- campaigns ----------------------------------------------------------------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  story_angle text,
  data_study_title text,
  data_study_summary text,
  data_study_url text,
  status campaign_status not null default 'draft'
);

-- pitches ------------------------------------------------------------------
-- journalist_id uses ON DELETE RESTRICT so a journalist with pitch history
-- cannot be silently removed; campaign deletion cascades to its pitches.
create table pitches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  journalist_id uuid not null references journalists (id) on delete restrict,
  subject text,
  body text,
  status pitch_status not null default 'drafted',
  match_score double precision,
  approved_by text,
  approved_at timestamptz,
  pushed_at timestamptz
);

-- monitor_events -----------------------------------------------------------
create table monitor_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references clients (id) on delete cascade,
  source monitor_source not null,
  title text not null,
  url text,
  summary text,
  deadline_at timestamptz,
  status monitor_event_status not null default 'new',
  draft_response text
);

-- placements ---------------------------------------------------------------
-- A placement always belongs to a client; its campaign/pitch/monitor origin is
-- optional and set null on source deletion so the coverage log is never lost.
create table placements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references clients (id) on delete cascade,
  campaign_id uuid references campaigns (id) on delete set null,
  pitch_id uuid references pitches (id) on delete set null,
  monitor_event_id uuid references monitor_events (id) on delete set null,
  publication_name text,
  url text,
  headline text,
  published_at timestamptz,
  placement_type placement_type not null
);

-- metrics_snapshots --------------------------------------------------------
create table metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references clients (id) on delete cascade,
  snapshot_date date not null,
  backlinks_count integer not null default 0,
  referring_domains integer not null default 0,
  ai_mentions_count integer not null default 0,
  ai_mentions_breakdown jsonb not null default '{}'::jsonb,
  source metrics_source not null default 'mock'
);

comment on column publications.scrape_config is
  'Per-site scraper hints (author-page patterns, selectors); shape owned by the scraper provider.';
comment on column metrics_snapshots.ai_mentions_breakdown is
  'Per-engine mention counts, e.g. {"chatgpt": 12, "perplexity": 5, "gemini": 3}.';

-- updated_at triggers on every table --------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'publications', 'journalists', 'articles', 'clients', 'campaigns',
    'pitches', 'monitor_events', 'placements', 'metrics_snapshots'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function set_updated_at()', t);
  end loop;
end $$;

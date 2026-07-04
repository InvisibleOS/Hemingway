-- Hemingway :: enum types
-- Column-level enums from docs/data-model.md. `vertical` is shared by
-- publications and clients. The word "source" appears on two tables with
-- different value sets, so there are two distinct source enums:
-- monitor_source (monitor_events) and metrics_source (metrics_snapshots).

create type vertical as enum ('fnb', 'hospitality', 'real_estate', 'd2c', 'other');

create type publication_tier as enum ('national', 'regional', 'trade', 'blog');

create type email_status as enum ('unverified', 'pattern_guess', 'verified', 'bounced');

create type sending_domain_status as enum ('not_setup', 'warming', 'ready', 'degraded');

create type campaign_status as enum ('draft', 'matching', 'pitching', 'active', 'closed');

create type pitch_status as enum (
  'drafted', 'edited', 'approved', 'pushed', 'replied', 'placed', 'declined', 'bounced'
);

create type monitor_source as enum ('expert_platform', 'brand_mention', 'journo_request');

create type monitor_event_status as enum ('new', 'drafted', 'responded', 'won', 'ignored');

create type placement_type as enum ('feature', 'quote', 'listicle', 'directory', 'mention');

create type metrics_source as enum ('dataforseo', 'mock');

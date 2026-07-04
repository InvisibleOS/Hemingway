# Data model

All tables have id (uuid), created_at, updated_at. RLS on from day one,
single-org policies (this is internal, but do not skip RLS).

## publications
name, website, vertical (enum: fnb, hospitality, real_estate, d2c, other),
tier (enum: national, regional, trade, blog), scrape_config (jsonb),
last_scraped_at

## journalists
publication_id FK, name, role, email, email_status (enum: unverified,
pattern_guess, verified, bounced), email_verified_at, beat_summary (text),
receptivity_notes (text, AI-generated), quotes_founders (bool),
uses_data_studies (bool), profile_embedding (vector), last_profiled_at

## articles
journalist_id FK, title, url, published_at, summary (text),
embedding (vector)

## clients
name, website, vertical, sending_domain, sending_domain_status (enum:
not_setup, warming, ready, degraded), knowledge_base (text, from onboarding),
active (bool)

## campaigns
client_id FK, name, story_angle (text), data_study_title, data_study_summary,
data_study_url, status (enum: draft, matching, pitching, active, closed)

## pitches
campaign_id FK, journalist_id FK, subject, body, status (enum: drafted,
edited, approved, pushed, replied, placed, declined, bounced),
match_score (float), approved_by (text), approved_at, pushed_at

## monitor_events
client_id FK, source (enum: expert_platform, brand_mention, journo_request),
title, url, summary, deadline_at, status (enum: new, drafted, responded,
won, ignored), draft_response (text)

## placements
client_id FK, campaign_id FK nullable, pitch_id FK nullable,
monitor_event_id FK nullable, publication_name, url, headline,
published_at, placement_type (enum: feature, quote, listicle, directory,
mention)

## metrics_snapshots
client_id FK, snapshot_date, backlinks_count, referring_domains,
ai_mentions_count, ai_mentions_breakdown (jsonb per engine), source (enum:
dataforseo, mock)

## Matching
Story angle text is embedded and compared against journalist
profile_embedding + recent article embeddings via pgvector cosine
similarity. MVP can fall back to a weighted keyword score if embeddings
are not ready; put the scoring behind /lib/matching/ so the
implementation can swap.

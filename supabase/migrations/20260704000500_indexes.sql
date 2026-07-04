-- Hemingway :: indexes
-- FK lookups, common list filters, and HNSW cosine indexes for vector matching.
-- HNSW is used over ivfflat: it needs no training data, so it works on the
-- empty tables a fresh migration produces and stays accurate as rows arrive.

-- publications
create unique index publications_website_key on publications (lower(website));
create index publications_vertical_idx on publications (vertical);
create index publications_tier_idx on publications (tier);

-- journalists
create index journalists_publication_id_idx on journalists (publication_id);
create index journalists_email_status_idx on journalists (email_status);
create index journalists_email_idx on journalists (lower(email)) where email is not null;
create index journalists_profile_embedding_idx
  on journalists using hnsw (profile_embedding vector_cosine_ops);

-- articles
create index articles_journalist_id_idx on articles (journalist_id);
create index articles_published_at_idx on articles (published_at desc nulls last);
create index articles_embedding_idx
  on articles using hnsw (embedding vector_cosine_ops);

-- clients
create index clients_vertical_idx on clients (vertical);
create index clients_active_idx on clients (active);

-- campaigns
create index campaigns_client_id_idx on campaigns (client_id);
create index campaigns_status_idx on campaigns (status);

-- pitches
create index pitches_campaign_id_idx on pitches (campaign_id);
create index pitches_journalist_id_idx on pitches (journalist_id);
create index pitches_status_idx on pitches (status);

-- monitor_events
create index monitor_events_client_id_idx on monitor_events (client_id);
create index monitor_events_status_idx on monitor_events (status);
create index monitor_events_deadline_at_idx on monitor_events (deadline_at);

-- placements
create index placements_client_id_idx on placements (client_id);
create index placements_campaign_id_idx on placements (campaign_id);
create index placements_pitch_id_idx on placements (pitch_id);
create index placements_monitor_event_id_idx on placements (monitor_event_id);
create index placements_published_at_idx on placements (published_at desc nulls last);

-- metrics_snapshots
-- One snapshot per client per day per source; the unique index also serves lookups.
create unique index metrics_snapshots_client_date_source_key
  on metrics_snapshots (client_id, snapshot_date, source);

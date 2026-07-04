-- Hemingway :: row level security
-- Internal single-org tool: RLS is enabled on every table from day one
-- (docs/data-model.md). Policy model: `authenticated` (our team) gets full
-- access, `anon` gets nothing (no policy = deny). The server-side service_role
-- key bypasses RLS entirely, which is what seed scripts and background jobs use.

do $$
declare
  t text;
begin
  foreach t in array array[
    'publications', 'journalists', 'articles', 'clients', 'campaigns',
    'pitches', 'monitor_events', 'placements', 'metrics_snapshots'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
    execute format(
      'create policy %I on public.%I
         for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t);
  end loop;
end $$;

-- Hemingway :: shared functions
-- updated_at maintenance. A single trigger function is attached to every
-- table in the tables migration so updated_at always tracks the last write.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

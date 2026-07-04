-- Hemingway :: matching RPC
-- Ranks journalists against a story-angle embedding using pgvector cosine
-- similarity, blending the journalist profile embedding with their single best
-- recent article embedding (docs/data-model.md "Matching").
--
-- Callers embed the story angle via the llm provider, then call this RPC. The
-- /lib/matching layer owns the choice between this embedding path and the
-- keyword fallback; this function is only the embedding path.
--
-- SECURITY INVOKER (default): RLS applies as the calling role, so an
-- authenticated operator only matches over rows their policy permits.
--
-- Score = profile_weight * profile_similarity
--       + (1 - profile_weight) * best_article_similarity
-- where similarity = 1 - cosine_distance. When a journalist has no embedded
-- articles, their profile similarity stands in for the article term so they are
-- still ranked rather than dropped.

create or replace function match_journalists(
  query_embedding vector(1024),
  match_count int default 25,
  filter_vertical vertical default null,
  min_score float default 0.0,
  profile_weight float default 0.6
)
returns table (
  journalist_id uuid,
  score float,
  profile_similarity float,
  article_similarity float
)
language sql
stable
as $$
  with profiles as (
    select
      j.id,
      1 - (j.profile_embedding <=> query_embedding) as profile_similarity
    from journalists j
    join publications p on p.id = j.publication_id
    where j.profile_embedding is not null
      and (filter_vertical is null or p.vertical = filter_vertical)
  ),
  best_article as (
    select
      a.journalist_id,
      max(1 - (a.embedding <=> query_embedding)) as article_similarity
    from articles a
    where a.embedding is not null
      and a.journalist_id in (select id from profiles)
    group by a.journalist_id
  ),
  scored as (
    select
      pr.id as journalist_id,
      pr.profile_similarity,
      ba.article_similarity,
      profile_weight * pr.profile_similarity
        + (1 - profile_weight) * coalesce(ba.article_similarity, pr.profile_similarity) as score
    from profiles pr
    left join best_article ba on ba.journalist_id = pr.id
  )
  select
    scored.journalist_id,
    scored.score,
    scored.profile_similarity,
    scored.article_similarity
  from scored
  where scored.score >= min_score
  order by scored.score desc
  limit match_count;
$$;

grant execute on function match_journalists(vector, int, vertical, float, float)
  to authenticated, service_role;

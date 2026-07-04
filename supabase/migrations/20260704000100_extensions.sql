-- Hemingway :: extensions
-- pgvector powers journalist and story-angle embedding matching (see
-- docs/data-model.md "Matching"). gen_random_uuid() is provided by core
-- Postgres 13+, so no pgcrypto is required for primary keys.

create extension if not exists vector;

-- Remove legacy research/knowledge objects that are unrelated to the SaaS product.
-- The vector extension is retained because removing an extension can affect other projects
-- or future database features; only the unused objects are removed.

drop function if exists public.match_documents(vector, integer, jsonb);
drop function if exists public.match_knowledge_vault(vector, integer, jsonb);

drop table if exists public.research_vault;
drop table if exists public.zosoneir_knowledge_vault;

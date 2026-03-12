-- =============================================
-- Political Topics — Thematic Intelligence
-- =============================================

-- Temas sociales/políticos para investigar (inseguridad, inflación, etc.)
create table if not exists public.political_topics (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text default '',
    serp_queries jsonb default '[]'::jsonb,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, name)
);

alter table public.political_topics enable row level security;

create policy "Users manage own political topics"
    on public.political_topics for all
    using (auth.uid() = user_id);

create index idx_political_topics_user
    on public.political_topics(user_id, is_active);

-- Extend political_intel_reports to support thematic reports
alter table public.political_intel_reports
    add column if not exists topic_id uuid references public.political_topics(id) on delete set null;

-- Allow 'thematic' as report_type
-- (Drop old CHECK if it exists, then create inclusive one)
do $$
begin
    alter table public.political_intel_reports
        drop constraint if exists political_intel_reports_report_type_check;
exception when others then null;
end $$;

-- =============================================
-- Political Intelligence V2 — Schema
-- =============================================

-- 1. CAMPAIGN PROFILES: Identidad del cliente (obligatorio para attack vectors)
create table if not exists public.political_campaign_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    campaign_name text not null,
    candidate_name text not null,
    party text not null default '',
    ideology_spectrum text not null default '',
    core_positions jsonb not null default '[]'::jsonb,
    key_proposals jsonb not null default '[]'::jsonb,
    target_voters text not null default '',
    coalition_allies text[] default '{}',
    red_lines text[] default '{}',
    tone_guidelines text not null default '',
    communication_style text not null default 'propositivo'
        check (communication_style in ('propositivo', 'confrontativo', 'tecnico', 'popular')),
    country text not null default 'ar',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id)
);

alter table public.political_campaign_profiles enable row level security;

create policy "Users manage own campaign profiles"
    on public.political_campaign_profiles for all
    using (auth.uid() = user_id);

-- 2. MONITORS: Rivales/targets configurados por usuario
create table if not exists public.political_monitors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    handle text not null,
    full_name text not null,
    party text default '',
    role text default '',
    country text default 'ar',
    platform text default 'twitter'
        check (platform in ('twitter', 'instagram', 'tiktok')),
    serp_queries jsonb default '[]'::jsonb,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, handle, platform)
);

alter table public.political_monitors enable row level security;

create policy "Users manage own political monitors"
    on public.political_monitors for all
    using (auth.uid() = user_id);

create index idx_political_monitors_user
    on public.political_monitors(user_id, is_active);

-- 3. SNAPSHOTS: Historial de scrapes por monitor
create table if not exists public.political_snapshots (
    id uuid primary key default gen_random_uuid(),
    monitor_id uuid not null references public.political_monitors(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    profile_data jsonb not null,
    metrics jsonb,
    serp_context jsonb,
    scraped_at timestamptz default now()
);

alter table public.political_snapshots enable row level security;

create policy "Users manage own political snapshots"
    on public.political_snapshots for all
    using (auth.uid() = user_id);

create index idx_political_snapshots_monitor
    on public.political_snapshots(monitor_id, scraped_at desc);

create index idx_political_snapshots_user
    on public.political_snapshots(user_id, scraped_at desc);

-- 4. EXTEND existing political_intel_reports with user scoping + v2 fields
alter table public.political_intel_reports
    add column if not exists user_id uuid references auth.users(id) on delete cascade,
    add column if not exists monitor_ids uuid[] default '{}',
    add column if not exists snapshot_ids uuid[] default '{}',
    add column if not exists attack_vectors jsonb,
    add column if not exists social_calendar jsonb,
    add column if not exists change_summary jsonb;

-- Drop old policy and create user-scoped one
drop policy if exists "Authenticated users can read intel reports" on public.political_intel_reports;

create policy "Users manage own political intel reports"
    on public.political_intel_reports for all
    using (auth.uid() = user_id or auth.uid() = created_by);

create index if not exists idx_political_intel_reports_user
    on public.political_intel_reports(user_id, report_date desc);

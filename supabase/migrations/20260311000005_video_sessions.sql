-- =============================================
-- Video Repurposer Sessions — Persistencia
-- =============================================

create table if not exists public.video_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    video_url text not null,
    video_title text not null default '',
    speaker_name text default '',
    duration_seconds integer default 0,
    analysis jsonb,
    calendar jsonb,
    clips jsonb default '[]'::jsonb,
    direct_video_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.video_sessions enable row level security;

create policy "Users manage own video sessions"
    on public.video_sessions for all
    using (auth.uid() = user_id);

create index idx_video_sessions_user
    on public.video_sessions(user_id, created_at desc);

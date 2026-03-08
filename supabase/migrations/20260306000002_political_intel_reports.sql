-- Store political intel reports in DB instead of filesystem (serverless-safe)
create table if not exists public.political_intel_reports (
    id uuid primary key default gen_random_uuid(),
    report_type text not null check (report_type in ('snapshot', 'report', 'dashboard')),
    report_date date not null default current_date,
    content jsonb not null default '{}',
    html_content text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

create index idx_intel_reports_type_date on public.political_intel_reports(report_type, report_date desc);

alter table public.political_intel_reports enable row level security;

create policy "Authenticated users can read intel reports"
    on public.political_intel_reports for select
    using (auth.uid() is not null);

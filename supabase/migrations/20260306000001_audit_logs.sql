-- Audit log table for tracking admin/security events
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity_type text,
    entity_id text,
    metadata jsonb default '{}',
    ip_address text,
    created_at timestamptz default now()
);

-- Index for common queries
create index idx_audit_logs_actor on public.audit_logs(actor_id);
create index idx_audit_logs_action on public.audit_logs(action);
create index idx_audit_logs_created on public.audit_logs(created_at desc);

-- RLS: only admins can read, service role can insert
alter table public.audit_logs enable row level security;

create policy "Admins can read audit logs"
    on public.audit_logs for select
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- No insert/update/delete policies for regular users — only service role inserts

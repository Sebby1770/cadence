-- Multi-tenant: companies, company_id scoping, audit log

create table if not exists companies (
  id text primary key,
  name text not null,
  slug text unique,
  join_code text unique,
  accent text default '245 68% 60%',
  owner_employee_id text,
  created_at timestamptz default now()
);

insert into companies (id, name, slug, join_code, accent, owner_employee_id)
values ('c-demo', 'Cadence Coffee Co.', 'demo', 'DEMO24', '245 68% 60%', 'e1')
on conflict (id) do nothing;

-- Add company_id (default demo) to every tenant table + backfill + index
do $$
declare t text;
begin
  foreach t in array array[
    'departments','locations','positions','employees','badges',
    'shifts','swap_requests','leave_requests','announcements',
    'notifications','chat_threads','chat_messages','recognition'
  ]
  loop
    execute format('alter table public.%I add column if not exists company_id text references companies(id) default ''c-demo'';', t);
    execute format('update public.%I set company_id = ''c-demo'' where company_id is null;', t);
    execute format('create index if not exists %I on public.%I(company_id);', t || '_company_idx', t);
  end loop;
end $$;

alter table public.profiles add column if not exists company_id text references companies(id) default 'c-demo';

-- Audit / change log
create table if not exists audit_log (
  id text primary key,
  company_id text references companies(id) default 'c-demo',
  actor_id text,
  action text not null,
  entity text,
  entity_id text,
  summary text,
  created_at timestamptz default now()
);
create index if not exists audit_company_idx on audit_log(company_id, created_at desc);

-- RLS + policies for the new tables
alter table public.companies enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "read_all_companies" on public.companies;
drop policy if exists "write_companies" on public.companies;
drop policy if exists "read_all_audit" on public.audit_log;
drop policy if exists "write_audit" on public.audit_log;

create policy "read_all_companies" on public.companies for select to anon, authenticated using (true);
create policy "write_companies" on public.companies for all to anon, authenticated using (true) with check (true);
create policy "read_all_audit" on public.audit_log for select to anon, authenticated using (true);
create policy "write_audit" on public.audit_log for all to anon, authenticated using (true) with check (true);

-- Realtime
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.audit_log'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.companies'; exception when duplicate_object then null; end;
end $$;

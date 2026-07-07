-- Row-level security + realtime for Cadence

do $$
declare t text;
begin
  foreach t in array array[
    'departments','locations','positions','badges','employees',
    'shifts','swap_requests','leave_requests','announcements',
    'notifications','chat_threads','chat_messages','recognition','profiles'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Read access for everyone (demo data) on all tables
do $$
declare t text;
begin
  foreach t in array array[
    'departments','locations','positions','badges','employees',
    'shifts','swap_requests','leave_requests','announcements',
    'notifications','chat_threads','chat_messages','recognition'
  ]
  loop
    execute format($f$create policy "read_all_%s" on public.%I for select to anon, authenticated using (true);$f$, t, t);
  end loop;
end $$;

-- Write access on operational tables (demo shared state)
do $$
declare t text;
begin
  foreach t in array array[
    'shifts','swap_requests','leave_requests','notifications',
    'chat_threads','chat_messages','recognition','announcements'
  ]
  loop
    execute format($f$create policy "write_%s" on public.%I for all to anon, authenticated using (true) with check (true);$f$, t, t);
  end loop;
end $$;

-- Profiles: a user manages only their own row
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_upsert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- Realtime for live multi-user sync
alter publication supabase_realtime add table public.shifts;
alter publication supabase_realtime add table public.swap_requests;
alter publication supabase_realtime add table public.leave_requests;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.recognition;

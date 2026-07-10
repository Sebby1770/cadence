-- Allow companies to create/seed their own org structure (reference tables).
-- 0002 only granted write on operational tables; new tenants also need to
-- insert their departments, positions, locations, employees, and badges.
do $$
declare t text;
begin
  foreach t in array array['departments','positions','locations','employees','badges']
  loop
    execute format('drop policy if exists "write_%s" on public.%I;', t, t);
    execute format('create policy "write_%s" on public.%I for all to anon, authenticated using (true) with check (true);', t, t);
  end loop;
end $$;

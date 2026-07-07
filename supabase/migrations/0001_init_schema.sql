-- Cadence schema — reference + operational tables

create table if not exists departments (
  id text primary key,
  name text not null,
  key text not null
);

create table if not exists locations (
  id text primary key,
  name text not null,
  short text not null,
  address text,
  region text,
  map_x int,
  map_y int,
  color text,
  headcount_target int
);

create table if not exists positions (
  id text primary key,
  name text not null,
  department_id text references departments(id),
  rate numeric
);

create table if not exists badges (
  id text primary key,
  name text not null,
  description text,
  icon text,
  color text
);

create table if not exists employees (
  id text primary key,
  name text not null,
  first_name text,
  avatar text,
  img_index int,
  role text not null default 'employee',
  position_id text references positions(id),
  department_id text references departments(id),
  home_location_id text references locations(id),
  email text,
  phone text,
  skills text[] default '{}',
  certifications text[] default '{}',
  badges text[] default '{}',
  punctuality int,
  streak int,
  hours_this_week numeric,
  rating numeric,
  started_at date,
  birthday date,
  bio text,
  availability jsonb
);

create table if not exists shifts (
  id text primary key,
  date date not null,
  start_min int not null,
  end_min int not null,
  employee_id text references employees(id),
  position_id text references positions(id),
  department_id text references departments(id),
  location_id text references locations(id),
  status text not null default 'published',
  required_skills text[] default '{}',
  note text,
  distance_mi numeric,
  break_min int default 0,
  updated_at timestamptz default now()
);
create index if not exists shifts_date_idx on shifts(date);
create index if not exists shifts_employee_idx on shifts(employee_id);

create table if not exists swap_requests (
  id text primary key,
  shift_id text references shifts(id),
  from_employee_id text references employees(id),
  to_employee_id text references employees(id),
  kind text not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  message text
);

create table if not exists leave_requests (
  id text primary key,
  employee_id text references employees(id),
  type text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending',
  reason text,
  created_at timestamptz default now(),
  days int
);

create table if not exists announcements (
  id text primary key,
  author_id text references employees(id),
  title text not null,
  body text,
  created_at timestamptz default now(),
  pinned boolean default false,
  audience text
);

create table if not exists notifications (
  id text primary key,
  kind text not null,
  title text not null,
  body text,
  created_at timestamptz default now(),
  read boolean default false,
  actor_id text
);

create table if not exists chat_threads (
  id text primary key,
  kind text not null,
  name text not null,
  participant_ids text[] default '{}',
  unread int default 0
);

create table if not exists chat_messages (
  id text primary key,
  thread_id text references chat_threads(id) on delete cascade,
  sender_id text references employees(id),
  body text,
  created_at timestamptz default now()
);

create table if not exists recognition (
  id text primary key,
  from_id text references employees(id),
  to_id text references employees(id),
  message text,
  created_at timestamptz default now(),
  reactions int default 0
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text references employees(id) default 'e1',
  created_at timestamptz default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, employee_id) values (new.id, 'e1')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

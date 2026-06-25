-- Tadbeer Intern Daily Work Tracker Supabase Schema
-- Paste this script into the SQL Editor of your Supabase project.

-- 1. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text check (role in ('admin', 'intern')) not null,
  role_title text,
  work_profile text,
  objectives_to_achieve text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add email column if it doesn't exist
alter table if exists public.profiles add column if not exists email text;

-- 2. Create Invitations Table (Magic Links tracking)
create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  token text not null unique,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Daily Reports Table
create table if not exists public.daily_reports (
  id uuid default gen_random_uuid() primary key,
  intern_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  hours_worked numeric(4,2) not null,
  objectives text not null,
  work_completed text not null,
  challenges text,
  suggestions text,
  waiting_for text,
  tomorrow_plan text not null,
  status text not null check (status in ('completed', 'in_progress', 'blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(intern_id, date)
);

-- 4. Create Comments Table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.daily_reports(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  comment_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.daily_reports enable row level security;
alter table public.comments enable row level security;

-- 6. Set up Security Policies

-- Clean up existing policies to prevent "already exists" errors
drop policy if exists "Enable read access for all authenticated users" on public.profiles;
drop policy if exists "Enable update for users based on email" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Enable insert for registration setup" on public.profiles;
drop policy if exists "Admins can manage invitations" on public.invitations;
drop policy if exists "Public can read invitations with token" on public.invitations;
drop policy if exists "Public can delete invitation after use" on public.invitations;
drop policy if exists "Interns can view their own reports" on public.daily_reports;
drop policy if exists "Interns can insert their own reports" on public.daily_reports;
drop policy if exists "Admins can view all reports" on public.daily_reports;
drop policy if exists "Admins can update reports" on public.daily_reports;
drop policy if exists "Users can view comments on accessible reports" on public.comments;
drop policy if exists "Admins can add comments" on public.comments;

-- Profiles Policies
create policy "Enable read access for all authenticated users" on public.profiles 
  for select to authenticated using (true);

create policy "Enable update for users based on email" on public.profiles 
  for update to authenticated using (auth.jwt()->>'email' in ('w.taufiqq@gmail.com', 'operation@tadbeertt.com'));

create policy "Enable insert for authenticated users only" on public.profiles 
  for insert to authenticated with check (true);

-- Invitations Policies
create policy "Admins can manage invitations" on public.invitations 
  for all to authenticated using (auth.jwt()->>'email' in ('w.taufiqq@gmail.com', 'operation@tadbeertt.com'));

create policy "Public can read invitations with token" on public.invitations
  for select using (true);

create policy "Public can delete invitation after use" on public.invitations
  for delete using (true);

-- Daily Reports Policies
create policy "Interns can view their own reports" on public.daily_reports 
  for select to authenticated using (auth.uid() = intern_id);

create policy "Interns can insert their own reports" on public.daily_reports 
  for insert to authenticated with check (auth.uid() = intern_id);

create policy "Admins can read all reports" on public.daily_reports 
  for select to authenticated using (auth.jwt()->>'email' in ('w.taufiqq@gmail.com', 'operation@tadbeertt.com'));

create policy "Admins can update reports" on public.daily_reports 
  for update to authenticated using (auth.jwt()->>'email' in ('w.taufiqq@gmail.com', 'operation@tadbeertt.com'));

-- ----------------------------------------------------------------------------
-- 5. Intern Tasks Table
-- ----------------------------------------------------------------------------
create table if not exists public.intern_tasks (
  id uuid default gen_random_uuid() primary key,
  intern_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  status text check (status in ('pending', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for intern_tasks
alter table public.intern_tasks enable row level security;

create policy "Enable read for authenticated users" on public.intern_tasks 
  for select to authenticated using (true);

create policy "Enable insert for admins" on public.intern_tasks 
  for insert to authenticated with check (auth.jwt()->>'email' in ('w.taufiqq@gmail.com', 'operation@tadbeertt.com'));

create policy "Enable update for interns and admins" on public.intern_tasks 
  for update to authenticated using (true);

-- Comments Policies
create policy "Users can view comments on accessible reports" on public.comments 
  for select to authenticated using (true);

create policy "Users can insert comments on reports" on public.comments 
  for insert to authenticated with check (auth.jwt()->>'email' in ('w.taufiqq@gmail.com', 'operation@tadbeertt.com'));

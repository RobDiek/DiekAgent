-- DiekAI Workbench - Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index profiles_id_idx on profiles(id);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New Chat',
  model text not null default 'gpt-4o-mini',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index conversations_user_id_idx on conversations(user_id);
create index conversations_created_at_idx on conversations(created_at desc);

alter table conversations enable row level security;

create policy "Users can manage own conversations"
  on conversations for all using (auth.uid() = user_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index messages_conversation_id_idx on messages(conversation_id);
create index messages_created_at_idx on messages(created_at);

alter table messages enable row level security;

create policy "Users can manage messages in own conversations"
  on messages for all using (
    auth.uid() = (select user_id from conversations where id = conversation_id)
  );

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  type text not null check (type in ('blog', 'email', 'technical_concept', 'proposal', 'comparison', 'meeting_summary')),
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index documents_user_id_idx on documents(user_id);
create index documents_created_at_idx on documents(created_at desc);

alter table documents enable row level security;

create policy "Users can manage own documents"
  on documents for all using (auth.uid() = user_id);

-- ============================================================
-- PRESENTATIONS
-- ============================================================
create table presentations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  topic text not null,
  slides jsonb not null default '[]',
  created_at timestamptz default now()
);

create index presentations_user_id_idx on presentations(user_id);

alter table presentations enable row level security;

create policy "Users can manage own presentations"
  on presentations for all using (auth.uid() = user_id);

-- ============================================================
-- RESEARCH TASKS
-- ============================================================
create table research_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  topic text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  result jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index research_tasks_user_id_idx on research_tasks(user_id);
create index research_tasks_status_idx on research_tasks(status);

alter table research_tasks enable row level security;

create policy "Users can manage own research tasks"
  on research_tasks for all using (auth.uid() = user_id);

-- ============================================================
-- AGENTS
-- ============================================================
create table agents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text default '',
  system_prompt text not null,
  model text not null default 'gpt-4o-mini',
  allowed_tools text[] default '{}',
  created_at timestamptz default now()
);

create index agents_user_id_idx on agents(user_id);

alter table agents enable row level security;

create policy "Users can manage own agents"
  on agents for all using (auth.uid() = user_id);

-- ============================================================
-- AGENT RUNS
-- ============================================================
create table agent_runs (
  id uuid default uuid_generate_v4() primary key,
  agent_id uuid references agents on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  input text not null,
  output text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index agent_runs_agent_id_idx on agent_runs(agent_id);
create index agent_runs_user_id_idx on agent_runs(user_id);
create index agent_runs_status_idx on agent_runs(status);

alter table agent_runs enable row level security;

create policy "Users can manage own agent runs"
  on agent_runs for all using (auth.uid() = user_id);

-- ============================================================
-- UPLOADED FILES
-- ============================================================
create table uploaded_files (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  filename text not null,
  file_type text,
  file_size bigint default 0,
  content text,
  storage_path text,
  created_at timestamptz default now()
);

create index uploaded_files_user_id_idx on uploaded_files(user_id);

alter table uploaded_files enable row level security;

create policy "Users can manage own uploaded files"
  on uploaded_files for all using (auth.uid() = user_id);

-- ============================================================
-- USAGE EVENTS
-- ============================================================
create table usage_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  event_type text not null,
  model text,
  tokens_used integer default 0,
  created_at timestamptz default now()
);

create index usage_events_user_id_idx on usage_events(user_id);
create index usage_events_created_at_idx on usage_events(created_at desc);

alter table usage_events enable row level security;

create policy "Users can manage own usage events"
  on usage_events for all using (auth.uid() = user_id);

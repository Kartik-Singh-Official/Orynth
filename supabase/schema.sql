-- =========================================================================
-- Orynth Database Schema for Supabase
-- Theme: Open-Source Contributor Guide (RAG with Gemma)
-- =========================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. Table: user_saved_questions
-- Stores questions asked by contributors along with Gemma RAG answers,
-- exact file/line citations, and retrieved documentation passages.
-- -------------------------------------------------------------------------
create table if not exists public.user_saved_questions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    repo_owner text not null,
    repo_name text not null,
    question text not null,
    answer text not null,
    citations jsonb default '[]'::jsonb,
    passages jsonb default '[]'::jsonb,
    tier_applied text default 'grounded',
    similarity_score numeric(4, 3),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_saved_questions_user on public.user_saved_questions(user_id);
create index if not exists idx_saved_questions_repo on public.user_saved_questions(repo_owner, repo_name);
create index if not exists idx_saved_questions_created on public.user_saved_questions(created_at desc);

-- -------------------------------------------------------------------------
-- 2. Table: user_saved_checklists
-- Stores synthesized contributor onboarding checklists with step progress.
-- -------------------------------------------------------------------------
create table if not exists public.user_saved_checklists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    repo_owner text not null,
    repo_name text not null,
    title text default 'Contributor Onboarding Checklist',
    steps jsonb not null default '[]'::jsonb,
    completed_step_ids jsonb not null default '[]'::jsonb,
    total_steps integer default 5,
    covered_steps integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_saved_checklists_user on public.user_saved_checklists(user_id);
create index if not exists idx_saved_checklists_repo on public.user_saved_checklists(repo_owner, repo_name);

-- -------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Policies
-- Ensures users can ONLY see, edit, and delete their own saved work.
-- -------------------------------------------------------------------------
alter table public.user_saved_questions enable row level security;
alter table public.user_saved_checklists enable row level security;

-- Policies for user_saved_questions
create policy "Users can view their own saved questions"
    on public.user_saved_questions for select
    using (auth.uid() = user_id);

create policy "Users can save new questions"
    on public.user_saved_questions for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own saved questions"
    on public.user_saved_questions for delete
    using (auth.uid() = user_id);

-- Policies for user_saved_checklists
create policy "Users can view their own saved checklists"
    on public.user_saved_checklists for select
    using (auth.uid() = user_id);

create policy "Users can save new checklists"
    on public.user_saved_checklists for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own checklists"
    on public.user_saved_checklists for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own saved checklists"
    on public.user_saved_checklists for delete
    using (auth.uid() = user_id);

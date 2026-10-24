# Supabase Database & Authentication Setup Guide

Orynth integrates with **Supabase** (PostgreSQL + GoTrue Auth) to allow contributors to create an account, log in, and persist their work across sessions.

---

## What Gets Saved in Supabase?

1. **User Questions & Grounded Answers (`user_saved_questions`)**:
   - Repository name and owner (e.g. `pallets/flask`).
   - The question asked by the user.
   - The exact Gemma 4 RAG answer.
   - Authenticated file and line citations (e.g. `docs/installation.md#L7-L15`).
   - Retrieved passages with cosine similarity scores.
   - Tier applied (`grounded` or `refusal`).
   - Timestamps and 1-click restore into the Workspace.

2. **Onboarding Checklists & Progress (`user_saved_checklists`)**:
   - Synthesized 5-step contributor checklist for any repository.
   - Documented vs unsupported steps.
   - User step completion status (`completed_step_ids`), allowing contributors to check off items as they clone, set up dependencies, run tests, and open PRs.

3. **Row Level Security (RLS)**:
   - Every contributor's work is private to their account using Supabase's native PostgreSQL Row Level Security policies (`auth.uid() = user_id`).

---

## 3-Minute Setup Instructions

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, choose an organization, give your project a name (e.g., `Orynth-RAG`), and pick your region.

### Step 2: Run the SQL Schema
1. In your Supabase project dashboard, navigate to **SQL Editor** on the left navigation bar.
2. Open [`supabase/schema.sql`](file:///Users/karhiksingh/Orynth/supabase/schema.sql) in this repository and copy its entire contents.
3. Paste it into the Supabase SQL editor and click **Run**.
4. You will see `user_saved_questions` and `user_saved_checklists` created with all indexes and RLS policies enabled!

### Step 3: Configure Environment Variables
1. In Supabase, go to **Project Settings** > **API**.
2. Copy your **Project URL** and **anon public API Key**.
3. You have two convenient ways to connect:
   - **Option A (Environment file):** Add them to your `.env` file in the project root:
     ```bash
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - **Option B (Directly in the Web UI):** In the Orynth top bar, click the **"Local DB"** badge, enter your Project URL and Anon Key, and click **Save & Connect**. It will persist in your browser!

---

## Built-in Offline / Local Storage Fallback

If you run Orynth without setting up Supabase, the application automatically defaults to **Local Storage Mode**. You can still click **Sign Up**, **Log In**, save questions, and check off checklist steps immediately! When you later connect your Supabase credentials, the app seamlessly upgrades to your remote PostgreSQL cloud instance.

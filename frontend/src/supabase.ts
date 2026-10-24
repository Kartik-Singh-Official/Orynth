import { createClient, type SupabaseClient, type User, type Session } from "@supabase/supabase-js";
import type { Citation, RetrievedPassage } from "./api";

export interface SavedQuestion {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  question: string;
  answer: string;
  citations: Citation[];
  passages: RetrievedPassage[];
  tier_applied: string;
  similarity_score?: number;
  created_at: string;
}

export interface SavedChecklist {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  title: string;
  steps: any[];
  completed_step_ids: string[];
  total_steps: number;
  covered_steps: number;
  created_at: string;
  updated_at: string;
}

// Storage keys
const STORAGE_URL_KEY = "orynth_supabase_url";
const STORAGE_ANON_KEY = "orynth_supabase_anon_key";
const MOCK_QUESTIONS_KEY = "orynth_local_saved_questions";
const MOCK_CHECKLISTS_KEY = "orynth_local_saved_checklists";
const MOCK_USER_KEY = "orynth_local_user";

function getActiveSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const localUrl = localStorage.getItem(STORAGE_URL_KEY) || "";
  const localKey = localStorage.getItem(STORAGE_ANON_KEY) || "";

  return {
    url: localUrl.trim() || envUrl.trim(),
    anonKey: localKey.trim() || envKey.trim(),
  };
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getActiveSupabaseCredentials();
  if (!url || !anonKey) {
    clientInstance = null;
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
      clientInstance = null;
    }
  }
  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getActiveSupabaseCredentials();
  return Boolean(url && anonKey);
}

export function getSupabaseCredentials(): { url: string; hasKey: boolean; isCustom: boolean } {
  const { url, anonKey } = getActiveSupabaseCredentials();
  const localUrl = localStorage.getItem(STORAGE_URL_KEY);
  return {
    url,
    hasKey: Boolean(anonKey),
    isCustom: Boolean(localUrl),
  };
}

export function setCustomSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  clientInstance = null; // force re-instantiation
  getSupabase();
}

export function clearCustomSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_ANON_KEY);
  clientInstance = null;
}

// ---------------------------------------------------------------------------
// Authentication Helpers
// ---------------------------------------------------------------------------

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0],
        },
      },
    });
    if (error) throw error;
    return data;
  }

  // Local / Guest Mock Auth
  const mockUser: User = {
    id: "guest-" + Math.random().toString(36).substring(2, 9),
    app_metadata: {},
    user_metadata: { full_name: fullName || email.split("@")[0] },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
  };
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
  return { user: mockUser, session: null };
}

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // Local / Guest Mock Auth
  const mockUser: User = {
    id: "guest-user-1",
    app_metadata: {},
    user_metadata: { full_name: email.split("@")[0] },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
  };
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
  return { user: mockUser, session: null };
}

export async function signOutUser() {
  const client = getSupabase();
  if (client) {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
  localStorage.removeItem(MOCK_USER_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const client = getSupabase();
  if (client) {
    const { data: { user } } = await client.auth.getUser();
    return user;
  }
  const localStr = localStorage.getItem(MOCK_USER_KEY);
  if (localStr) {
    try {
      return JSON.parse(localStr) as User;
    } catch {
      return null;
    }
  }
  return null;
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabase();
  if (client) {
    const { data: { session } } = await client.auth.getSession();
    return session;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Saved Questions Data Operations
// ---------------------------------------------------------------------------

export async function saveQuestionToDb(params: {
  repoOwner: string;
  repoName: string;
  question: string;
  answer: string;
  citations: Citation[];
  passages: RetrievedPassage[];
  tierApplied?: string;
  similarityScore?: number;
}): Promise<SavedQuestion> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to save questions.");
  }

  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("user_saved_questions")
      .insert({
        user_id: user.id,
        repo_owner: params.repoOwner,
        repo_name: params.repoName,
        question: params.question,
        answer: params.answer,
        citations: params.citations,
        passages: params.passages,
        tier_applied: params.tierApplied || "grounded",
        similarity_score: params.similarityScore ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavedQuestion;
  }

  // Local storage fallback
  const existing = getLocalQuestions();
  const newItem: SavedQuestion = {
    id: "local-q-" + Date.now(),
    user_id: user.id,
    repo_owner: params.repoOwner,
    repo_name: params.repoName,
    question: params.question,
    answer: params.answer,
    citations: params.citations,
    passages: params.passages,
    tier_applied: params.tierApplied || "grounded",
    similarity_score: params.similarityScore,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(MOCK_QUESTIONS_KEY, JSON.stringify([newItem, ...existing]));
  return newItem;
}

export async function fetchSavedQuestions(repoOwner?: string, repoName?: string): Promise<SavedQuestion[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const client = getSupabase();
  if (client) {
    let query = client
      .from("user_saved_questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (repoOwner && repoName) {
      query = query.eq("repo_owner", repoOwner).eq("repo_name", repoName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as SavedQuestion[];
  }

  // Local storage fallback
  let items = getLocalQuestions().filter((q) => q.user_id === user.id);
  if (repoOwner && repoName) {
    items = items.filter((q) => q.repo_owner === repoOwner && q.repo_name === repoName);
  }
  return items;
}

export async function deleteSavedQuestion(id: string): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from("user_saved_questions").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const items = getLocalQuestions().filter((q) => q.id !== id);
  localStorage.setItem(MOCK_QUESTIONS_KEY, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// Saved Checklists Data Operations
// ---------------------------------------------------------------------------

export async function saveChecklistToDb(params: {
  repoOwner: string;
  repoName: string;
  title?: string;
  steps: any[];
  completedStepIds?: string[];
  totalSteps?: number;
  coveredSteps?: number;
}): Promise<SavedChecklist> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to save checklists.");
  }

  const client = getSupabase();
  if (client) {
    const { data, error } = await client
      .from("user_saved_checklists")
      .insert({
        user_id: user.id,
        repo_owner: params.repoOwner,
        repo_name: params.repoName,
        title: params.title || "Contributor Onboarding Checklist",
        steps: params.steps,
        completed_step_ids: params.completedStepIds || [],
        total_steps: params.totalSteps || params.steps.length,
        covered_steps: params.coveredSteps || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SavedChecklist;
  }

  // Local fallback
  const existing = getLocalChecklists();
  const newItem: SavedChecklist = {
    id: "local-cl-" + Date.now(),
    user_id: user.id,
    repo_owner: params.repoOwner,
    repo_name: params.repoName,
    title: params.title || "Contributor Onboarding Checklist",
    steps: params.steps,
    completed_step_ids: params.completedStepIds || [],
    total_steps: params.totalSteps || params.steps.length,
    covered_steps: params.coveredSteps || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(MOCK_CHECKLISTS_KEY, JSON.stringify([newItem, ...existing]));
  return newItem;
}

export async function fetchSavedChecklists(repoOwner?: string, repoName?: string): Promise<SavedChecklist[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const client = getSupabase();
  if (client) {
    let query = client
      .from("user_saved_checklists")
      .select("*")
      .order("updated_at", { ascending: false });

    if (repoOwner && repoName) {
      query = query.eq("repo_owner", repoOwner).eq("repo_name", repoName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as SavedChecklist[];
  }

  let items = getLocalChecklists().filter((cl) => cl.user_id === user.id);
  if (repoOwner && repoName) {
    items = items.filter((cl) => cl.repo_owner === repoOwner && cl.repo_name === repoName);
  }
  return items;
}

export async function updateSavedChecklistProgress(id: string, completedStepIds: string[]): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client
      .from("user_saved_checklists")
      .update({
        completed_step_ids: completedStepIds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  const items = getLocalChecklists().map((cl) => {
    if (cl.id === id) {
      return {
        ...cl,
        completed_step_ids: completedStepIds,
        updated_at: new Date().toISOString(),
      };
    }
    return cl;
  });
  localStorage.setItem(MOCK_CHECKLISTS_KEY, JSON.stringify(items));
}

export async function deleteSavedChecklist(id: string): Promise<void> {
  const client = getSupabase();
  if (client) {
    const { error } = await client.from("user_saved_checklists").delete().eq("id", id);
    if (error) throw error;
    return;
  }

  const items = getLocalChecklists().filter((cl) => cl.id !== id);
  localStorage.setItem(MOCK_CHECKLISTS_KEY, JSON.stringify(items));
}

// Helpers
function getLocalQuestions(): SavedQuestion[] {
  try {
    const str = localStorage.getItem(MOCK_QUESTIONS_KEY);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

function getLocalChecklists(): SavedChecklist[] {
  try {
    const str = localStorage.getItem(MOCK_CHECKLISTS_KEY);
    return str ? JSON.parse(str) : [];
  } catch {
    return [];
  }
}

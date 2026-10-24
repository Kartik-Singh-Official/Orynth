/**
 * Orynth Frontend API Client
 * Connects to FastAPI RAG backend at http://localhost:8000
 */

export function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://127.0.0.1:8000/api";
    }
  }
  return "/api";
}

export const API_BASE = getApiBase();

export interface RepositoryMetadata {
  owner: string;
  repo: string;
  url: string;
  default_branch: string;
  description?: string;
  language?: string;
  stars: number;
  discovered_files_count: number;
}

export interface DocumentFile {
  path: string;
  url: string;
  size_bytes: number;
  file_type: string;
}

export interface DocumentChunk {
  chunk_id: string;
  file_path: string;
  file_url: string;
  heading: string;
  start_line: number;
  end_line: number;
  content: string;
  word_count: number;
}

export interface RetrievedPassage {
  chunk: DocumentChunk;
  similarity_score: number;
  rank: number;
}

export interface Citation {
  file_path: string;
  start_line?: number;
  end_line?: number;
  heading?: string;
  github_url: string;
  snippet: string;
}

export interface GroundedAnswer {
  question: string;
  answer: string;
  is_refusal: boolean;
  refusal_reason?: string;
  citations: Citation[];
  retrieved_passages: RetrievedPassage[];
  model_name: string;
  latency_ms: number;
  similarity_threshold?: number;
  tier_applied?: string;
  cached?: boolean;
}

export interface OnboardingStep {
  step_number: number;
  title: string;
  description: string;
  category: string;
  supporting_file?: string;
  supporting_url?: string;
  is_covered_in_docs: boolean;
  evidence_snippet?: string;
}

export interface OnboardingChecklist {
  repository: string;
  steps: OnboardingStep[];
  total_steps: number;
  covered_steps: number;
}

export interface EvaluationResult {
  case_id: string;
  question: string;
  category: string;
  expected_answerable: boolean;
  actual_refusal: boolean;
  correctness_score: number;
  citation_valid: boolean;
  retrieval_hit: boolean;
  latency_ms: number;
  actual_answer: string;
  retrieved_files: string[];
  failure_notes?: string;
}

export interface EvaluationReport {
  timestamp: string;
  total_questions: number;
  answerable_count: number;
  unanswerable_count: number;
  retrieval_hit_rate: number;
  citation_accuracy_rate: number;
  refusal_accuracy_rate: number;
  avg_latency_ms: number;
  results: EvaluationResult[];
  failure_cases: EvaluationResult[];
}

export async function fetchHealth(): Promise<{
  status: string;
  model: string;
  api_key_configured: boolean;
  indexed_chunks_count: number;
  active_repository: string | null;
}> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Failed to fetch backend health.");
  return res.json();
}

export async function fetchCurrentRepository(): Promise<{
  metadata: RepositoryMetadata;
  documents: DocumentFile[];
  chunks_count: number;
}> {
  const res = await fetch(`${API_BASE}/repository/current`);
  if (!res.ok) throw new Error("Failed to fetch active repository.");
  return res.json();
}

export async function inspectRepository(url: string): Promise<{
  metadata: RepositoryMetadata;
  discovered_files: DocumentFile[];
}> {
  const res = await fetch(`${API_BASE}/repository/inspect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Inspection failed." }));
    throw new Error(err.detail || "Repository inspection failed.");
  }
  return res.json();
}

export async function indexRepository(
  url?: string,
  useSample: boolean = false
): Promise<{
  message: string;
  metadata: RepositoryMetadata;
  files_count: number;
  chunks_count: number;
  indexing_time_ms: number;
}> {
  const res = await fetch(`${API_BASE}/repository/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, use_sample: useSample }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Indexing failed." }));
    throw new Error(err.detail || "Repository indexing failed.");
  }
  return res.json();
}

export async function askQuestion(
  question: string,
  top_k: number = 3
): Promise<GroundedAnswer> {
  const res = await fetch(`${API_BASE}/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed." }));
    throw new Error(err.detail || "Failed to generate answer.");
  }
  return res.json();
}

export async function fetchChecklist(): Promise<OnboardingChecklist> {
  const res = await fetch(`${API_BASE}/rag/checklist`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to generate checklist." }));
    throw new Error(err.detail || "Failed to generate onboarding checklist.");
  }
  return res.json();
}

export async function runEvaluation(): Promise<EvaluationReport> {
  const res = await fetch(`${API_BASE}/evaluation/run`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Evaluation benchmark failed." }));
    throw new Error(err.detail || "Benchmark run failed.");
  }
  return res.json();
}

export interface RateLimitStatusResponse {
  rate_limit: {
    client_ip: string;
    limit_rpm: number;
    used: number;
    remaining: number;
    reset_seconds: number;
  };
  cache: {
    size: number;
    max_size: number;
    hits: number;
    misses: number;
    hit_ratio_percent: number;
    ttl_seconds: number;
  };
}

export async function fetchRateLimitStatus(): Promise<RateLimitStatusResponse> {
  const res = await fetch(`${API_BASE}/rag/rate-limit-status`);
  if (!res.ok) throw new Error("Failed to fetch rate limit status.");
  return res.json();
}

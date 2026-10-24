# Orynth Codebase End-to-End Audit Report
**Theme**: Open-Source Contributor Guide (RAG with Gemma / Gemini)  
**Date of Audit**: October 24, 2026  
**Audited Target**: Full Stack Codebase (`backend/`, `frontend/`, `supabase/`, `tests/`, deployment configurations)  
**Status**: Comprehensive Vulnerability, Bug, and UI Analysis Complete  

---

## Executive Summary

An exhaustive end-to-end security, architecture, UI/UX, and code quality audit of **Orynth** was performed across all frontend components, FastAPI backend endpoints, vector indexing, retrieval logic, Supabase database schemas, and cloud deployment manifests.

The system features robust design patterns:
- In-memory vector embeddings with `sentence-transformers/all-MiniLM-L6-v2`.
- Strict RAG refusal thresholds preventing hallucinations on ungrounded queries.
- Apple Glass design aesthetics with micro-animations.
- Zero-dependency client-side markdown parsing eliminating `dangerouslySetInnerHTML` DOM-based XSS risks.
- Working mock mode fallback for Supabase and Gemini AI.

However, several **critical security loops**, **API quota risks**, **backend memory leaks**, and **UI state synchronization bugs** were uncovered. This document details every finding categorized by severity, along with exact code references, root cause analysis, and remediation patches ready for implementation.

---

## Summary Matrix of Findings

| ID | Category | Severity | Component | Summary |
|---|---|---|---|---|
| **SEC-01** | Security / API | **HIGH** | `backend/app.py:198` | Rate limiter bypass via spoofed `X-Forwarded-For` headers |
| **SEC-02** | Security / DoS | **MEDIUM** | `backend/rag/rate_limiter.py:24` | Unbounded memory growth in rate limiter client history |
| **SEC-03** | Security / DoS | **MEDIUM** | `backend/rag/embedder.py:9` | Unbounded `_embedding_cache` leading to memory exhaustion (OOM) |
| **SEC-04** | Security / CORS | **MEDIUM** | `backend/app.py:47-51` | Insecure CORS configuration (`allow_origins=["*"]` + `allow_credentials=True`) |
| **SEC-05** | Security / Auth | **MEDIUM** | `backend/app.py:54-55` | Global shared state across multi-tenant requests (index collision) |
| **SEC-06** | API Integration | **HIGH** | `backend/rag/repository_loader.py:84` | Unauthenticated GitHub API calls ignoring `GITHUB_TOKEN` |
| **SEC-07** | Input Validation | **LOW** | `backend/rag/repository_loader.py:53` | Potential directory traversal in shorthand GitHub slug parsing |
| **API-01** | API Quota | **HIGH** | `backend/rag/evaluation.py:247` | Benchmark execution bypasses rate limiter and triggers 429 quota exhaustion |
| **API-02** | Performance | **MEDIUM** | `backend/rag/repository_loader.py:168` | Sequential HTTP file fetching causing 15–25s indexing bottlenecks |
| **BUG-01** | Build & Test | **MEDIUM** | Root / `pyproject.toml` | `pytest` collection failure due to missing `pythonpath = ["."]` |
| **BUG-02** | Code Hygiene | **LOW** | `backend/app.py:72`, `evaluation.py:274` | Deprecated `@app.on_event("startup")` and `datetime.utcnow()` |
| **UI-01** | UI State | **MEDIUM** | `frontend/src/components/RepositoryBar.tsx:53` | Indexing callback resets document list to `[]`, causing UI flicker |
| **UI-02** | UI State | **LOW** | `frontend/src/components/RepositoryBar.tsx:34` | Previous inspection results persist on screen when subsequent URL errors |
| **UI-03** | UI / UX | **LOW** | `frontend/src/components/WorkspaceView.tsx:67` | Cooldown silently drops queries without explanatory user feedback |
| **UI-04** | Bundle Size | **LOW** | `frontend/src/` | Single monolithic bundle (>549 kB) without vendor code-splitting |
| **DB-01** | Security / Storage | **LOW** | `frontend/src/supabase.ts:90` | Risk of accidental Service Role key entry stored in plaintext `localStorage` |

---

## Detailed Findings & Remediation Guides

### Section 1: Security Loops & API Security

#### SEC-01: Rate Limiter Bypass via Spoofed `X-Forwarded-For` Headers
- **Severity**: HIGH
- **File**: `backend/app.py` (Lines 198, 220)
- **Description**:  
  The backend determines the client IP for rate limiting using:
  ```python
  client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "127.0.0.1")
  ```
  Because `X-Forwarded-For` is accepted from arbitrary incoming HTTP request headers without verifying that the request came from a trusted reverse proxy, any client can send a randomized `X-Forwarded-For` header (`X-Forwarded-For: 10.0.0.1`, `10.0.0.2`, etc.) with every request.
- **Impact**:  
  Completely neutralizes the 15 requests/minute token protection guard. An attacker or bot can exhaust Google AI Studio / Gemini API quotas within minutes, causing service denial for all users.
- **Recommended Fix**:
  Check `request.client.host` as primary, or only trust `X-Forwarded-For` if `request.client.host` belongs to trusted cloud proxy IPs (e.g. Render, Vercel, Cloudflare). Provide fallback to client host:
  ```python
  forwarded = request.headers.get("x-forwarded-for")
  if forwarded and os.environ.get("BEHIND_TRUSTED_PROXY", "false").lower() == "true":
      client_ip = forwarded.split(",")[0].strip()
  else:
      client_ip = request.client.host if request.client else "127.0.0.1"
  ```

---

#### SEC-02: Unbounded Memory Growth in Rate Limiter History
- **Severity**: MEDIUM
- **File**: `backend/rag/rate_limiter.py` (Lines 24–32, 69)
- **Description**:  
  `SlidingWindowRateLimiter` maintains a dictionary `self._history: Dict[str, deque] = defaultdict(deque)`. While `_clean_old_records` pops expired timestamps from individual deques, empty IP keys are **never removed** from `self._history`.
- **Impact**:  
  Over days of operation, or if an attacker scans the service with thousands of forged IP addresses, `self._history` will accumulate thousands of empty deques, leaking memory and eventually causing an Out-Of-Memory (OOM) termination on resource-constrained containers (such as Render 512MB RAM free instances).
- **Recommended Fix**:
  Clean up empty entries or cap history with an LRU cache or maximum size:
  ```python
  def _clean_old_records(self, ip: str, now: float) -> None:
      dq = self._history.get(ip)
      if dq is not None:
          cutoff = now - self.window_seconds
          while dq and dq[0] <= cutoff:
              dq.popleft()
          if not dq:
              del self._history[ip]
  ```

---

#### SEC-03: Unbounded Memory Leak in Embeddings Cache
- **Severity**: MEDIUM
- **File**: `backend/rag/embedder.py` (Lines 9, 26–33, 40–42)
- **Description**:  
  `_embedding_cache: Dict[str, np.ndarray] = {}` stores raw sentence-transformer vectors for every indexed document chunk and every user query with zero eviction policy, TTL, or maximum size limit.
- **Impact**:  
  Each 384-dimensional float vector occupies ~1.5 KB. If multiple repositories or large documents are indexed, the cache will consume hundreds of megabytes of RAM without ever freeing memory.
- **Recommended Fix**:
  Use `OrderedDict` with a maximum capacity (e.g., 5,000 items) or `functools.lru_cache`:
  ```python
  from collections import OrderedDict

  MAX_EMBEDDING_CACHE = 5000
  _embedding_cache: OrderedDict[str, np.ndarray] = OrderedDict()

  def _cache_vector(text: str, vector: np.ndarray) -> None:
      if len(_embedding_cache) >= MAX_EMBEDDING_CACHE:
          _embedding_cache.popitem(last=False)
      _embedding_cache[text] = vector
  ```

---

#### SEC-04: Insecure CORS Configuration (`allow_origins=["*"]` with `allow_credentials=True`)
- **Severity**: MEDIUM
- **File**: `backend/app.py` (Lines 46–51)
- **Description**:  
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
  Under the W3C Cross-Origin Resource Sharing specification, combining `allow_origins=["*"]` with `allow_credentials=True` is explicitly disallowed. Modern web browsers (Chrome, Firefox, Safari) will reject responses containing `Access-Control-Allow-Origin: *` when credentials mode is included, or allow unauthorized origin inspection.
- **Recommended Fix**:
  Explicitly configure allowed origins or derive them from environment variables:
  ```python
  allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://*.vercel.app").split(",")
  app.add_middleware(
      CORSMiddleware,
      allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
      allow_credentials=False if allowed_origins == ["*"] else True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

---

#### SEC-05: Global In-Memory Shared State Across Multi-Tenant Requests
- **Severity**: MEDIUM
- **File**: `backend/app.py` (Lines 54–55, 78, 169)
- **Description**:  
  `current_repository`, `current_documents`, and `active_index` are global singleton objects in Python module memory.
- **Impact**:  
  If User A indexes `pallets/flask` and User B concurrently indexes `torvalds/linux`, User A's questions will immediately query Linux documentation rather than Flask documentation. There is no tenant or session isolation.
- **Recommended Fix**:
  Maintain a multi-repository dictionary index `repository_store: Dict[str, VectorIndex] = {}` keyed by `owner/repo`. Pass `repo_key` with `/api/rag/ask`, defaulting to the active sample repo if unspecified:
  ```python
  repository_store: Dict[str, Tuple[RepositoryMetadata, List[DocumentFile], VectorIndex]] = {}
  ```

---

#### SEC-06: Unauthenticated GitHub API Requests Ignoring `GITHUB_TOKEN`
- **Severity**: HIGH
- **File**: `backend/rag/repository_loader.py` (Lines 82, 140)
- **Description**:  
  Calls to the GitHub REST API (`https://api.github.com/repos/...` and `git/trees/...`) use static headers:
  ```python
  headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "Orynth-RAG-Agent"}
  ```
  Neither function checks `os.environ.get("GITHUB_TOKEN")` or `os.environ.get("GH_TOKEN")`.
- **Impact**:  
  Unauthenticated GitHub API calls are rate-limited to only **60 requests per hour per IP address**. When deployed on cloud platforms like Render or AWS where egress IPs are shared, requests fail almost immediately with `403 Rate Limit Exceeded`. With a token, the quota rises to **5,000 requests per hour**.
- **Recommended Fix**:
  ```python
  gh_token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
  headers = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Orynth-RAG-Agent",
  }
  if gh_token:
      headers["Authorization"] = f"Bearer {gh_token.strip()}"
  ```

---

#### SEC-07: Shorthand GitHub Slug Regex Vulnerability
- **Severity**: LOW
- **File**: `backend/rag/repository_loader.py` (Lines 51–56)
- **Description**:  
  When validating shorthand strings like `owner/repo`:
  ```python
  if len(parts) == 2 and all(re.match(r"^[a-zA-Z0-9_\-\.]+$", p) for p in parts):
  ```
  The string `.` or `..` matches `^[a-zA-Z0-9_\-\.]+$`. An input like `../..` or `./.` passes this check.
- **Recommended Fix**:
  Enforce valid GitHub username and repository nomenclature (must not be `.` or `..`, must start with an alphanumeric character):
  ```python
  GITHUB_SLUG_PART = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_\-\.]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$")
  if len(parts) == 2 and all(GITHUB_SLUG_PART.match(p) and p not in (".", "..") for p in parts):
  ```

---

### Section 2: Backend Logic & API Pipeline Bugs

#### API-01: Benchmark Execution Bypasses Rate Limiter & Exhausts Gemini Quota
- **Severity**: HIGH
- **File**: `backend/app.py` (Line 240) & `backend/rag/evaluation.py` (Lines 179, 253)
- **Description**:  
  The endpoint `/api/evaluation/run` calls `run_evaluation_benchmark` which executes 16 test cases in parallel using `asyncio.Semaphore(6)`. Inside `_evaluate_single_case`, `generate_grounded_answer()` is called directly without passing through `global_rate_limiter`.
- **Impact**:  
  When a user runs the benchmark with a live Gemini API key, 16 requests are fired within 2–3 seconds. On Google AI Studio free tier (which enforces a strict 15 RPM limit), this instantly throws `429 RESOURCE_EXHAUSTED`, corrupting benchmark results and blocking subsequent user queries.
- **Recommended Fix**:
  For benchmark evaluation, run sequential or throttled execution with a 4-second delay, or use demo evaluation mode when running the full test suite in public instances:
  ```python
  # Add inter-case delay if live API key is present
  if os.environ.get("GOOGLE_API_KEY"):
      await asyncio.sleep(4.0)
  ```

---

#### API-02: Sequential Network Requests in `discover_documentation_files`
- **Severity**: MEDIUM
- **File**: `backend/rag/repository_loader.py` (Lines 168–187)
- **Description**:  
  `discover_documentation_files` loops over up to 25 discovered files and fetches them from `raw.githubusercontent.com` sequentially:
  ```python
  for path in seen_paths:
      content_resp = await client.get(raw_url)
  ```
- **Impact**:  
  Network latency accumulates to 15–25 seconds during repository inspection and indexing, causing slow UI loading and occasional HTTP gateway timeouts.
- **Recommended Fix**:
  Use `asyncio.gather` with a semaphore (`asyncio.Semaphore(5)`) to fetch documentation files concurrently, reducing discovery latency from ~20s down to ~2s.

---

#### BUG-01: Test Suite `pytest` Collection Failure Without `PYTHONPATH`
- **Severity**: MEDIUM
- **File**: Project Root / `pyproject.toml`
- **Description**:  
  Running standard `.venv/bin/pytest tests/` fails with:
  ```
  ModuleNotFoundError: No module named 'backend'
  ```
  The repository lacks a `pytest.ini` or `pyproject.toml` instructing `pytest` to include the project root in `sys.path`.
- **Recommended Fix**:
  Create or update `pyproject.toml` or `pytest.ini`:
  ```ini
  [pytest]
  pythonpath = .
  asyncio_mode = strict
  ```

---

#### BUG-02: Deprecated FastAPI `@app.on_event("startup")` & `datetime.utcnow()`
- **Severity**: LOW
- **File**: `backend/app.py` (Line 72), `backend/rag/evaluation.py` (Line 274)
- **Description**:  
  FastAPI has deprecated `@app.on_event("startup")` in favor of Lifespan handlers (`contextlib.asynccontextmanager`). Python 3.12+ has deprecated `datetime.utcnow()`.
- **Recommended Fix**:
  Use `datetime.now(timezone.utc)` and FastAPI lifespan context manager.

---

### Section 3: Frontend & UI State Bugs

#### UI-01: `indexRepository` Callback Resets Document List to `[]`
- **Severity**: MEDIUM
- **File**: `frontend/src/components/RepositoryBar.tsx` (Line 53)
- **Description**:  
  When indexing completes successfully, `RepositoryBar` executes:
  ```typescript
  onIndexed(res.metadata, [], res.chunks_count);
  ```
  In `App.tsx`:
  ```typescript
  const handleRepositoryIndexed = (meta: RepositoryMetadata, docs: DocumentFile[], chunks: number) => {
    setRepository(meta);
    setDocuments(docs); // <--- Sets documents state to EMPTY ARRAY!
    setChunksCount(chunks);
    initApp();
  };
  ```
- **Impact**:  
  Immediately after indexing, navigating to the **Sources** tab temporarily displays an empty table ("No documentation files loaded yet") until the background `initApp()` fetch completes.
- **Recommended Fix**:
  Have `/api/repository/index` return `documents: DocumentFile[]` in the JSON response, or pass `inspectResult?.discovered_files || []` into `onIndexed`.

---

#### UI-02: Stale Inspection Results Persist After An Input Error
- **Severity**: LOW
- **File**: `frontend/src/components/RepositoryBar.tsx` (Lines 27–38)
- **Description**:  
  If the user inspects Repo A (showing discovered files), then inputs an invalid URL for Repo B and submits, `errorMessage` is displayed, but `inspectResult` is never cleared.
- **Impact**:  
  The UI displays an error banner alongside the previous repository's documentation file list, misleading the user about which repository was inspected.
- **Recommended Fix**:
  Call `setInspectResult(null)` at the beginning of `handleInspect`.

---

#### UI-03: Cooldown Timer Drops Queries Silently Without Visual Indicator
- **Severity**: LOW
- **File**: `frontend/src/components/WorkspaceView.tsx` (Lines 66–67)
- **Description**:  
  In `WorkspaceView.tsx`:
  ```typescript
  const q = (qText || question).trim();
  if (!q || cooldown > 0) return;
  ```
  If a user clicks a suggestion prompt or submits a question while `cooldown > 0` (which lasts 3 seconds after an answer), the function returns silently with no visual notification.
- **Impact**:  
  The user feels the button or prompt chip is unresponsive or broken.
- **Recommended Fix**:
  Show a subtle countdown tag on the submit button (e.g. `Wait 2s...`) or display a brief notice toast if clicked during cooldown.

---

#### UI-04: Large Bundle Warning (>549 kB) in Production Build
- **Severity**: LOW
- **File**: `frontend/src/`
- **Description**:  
  `npm run build` flags:
  ```
  (!) Some chunks are larger than 500 kB after minification. (dist/assets/index-UDUwvst_.js: 549 kB)
  ```
  `lucide-react`, `@supabase/supabase-js`, and React core are bundled into a single JavaScript file.
- **Recommended Fix**:
  Configure manual chunking in `frontend/vite.config.ts`:
  ```typescript
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react']
        }
      }
    }
  }
  ```

---

### Section 4: Database & Storage Hygiene

#### DB-01: Risk of Service Role Key Inadvertently Saved to `localStorage`
- **Severity**: LOW
- **File**: `frontend/src/supabase.ts` (Lines 90–95)
- **Description**:  
  `setCustomSupabaseCredentials(url, anonKey)` stores credentials directly in browser `localStorage`. While public `anon` keys are safe for client-side storage, inexperienced users might inadvertently paste their Supabase `service_role` secret key into this field.
- **Recommended Fix**:
  Inspect the JWT payload of `anonKey` before persisting. If `payload.role === "service_role"`, reject the key with an explicit security warning explaining that service role keys must never be placed in frontend browsers.

---

## Action Plan for Remediation

To systematically address all identified items:

1. **Phase 1: Security & Quota Hardening**
   - Patch `backend/app.py` client IP extraction and CORS configuration.
   - Inject `GITHUB_TOKEN` into `backend/rag/repository_loader.py` headers.
   - Bound memory caches in `backend/rag/rate_limiter.py` and `backend/rag/embedder.py`.
   - Throttle concurrent benchmark evaluation in `backend/rag/evaluation.py`.

2. **Phase 2: Backend Reliability & Test Infrastructure**
   - Add `pytest.ini` for immediate zero-config test suite execution.
   - Convert `discover_documentation_files` to parallel async requests via `asyncio.gather`.
   - Replace deprecated FastAPI startup event and `datetime.utcnow()`.

3. **Phase 3: Frontend & UI State Synchronization**
   - Fix `onIndexed` document synchronization in `RepositoryBar.tsx`.
   - Clear inspection preview drawer on inspection error.
   - Add visual feedback for question submission cooldown.
   - Split chunks in `vite.config.ts`.

# Orynth — Implementation Plan & Milestones

**Project:** Orynth — Evidence-grounded AI contributor guide for open source  
**Hackathon Theme:** HacktoberFest HackDay Theme 2B: Open-Source Contributor Guide (RAG with Gemma)  
**Status:** Complete — All 6 Milestones Implemented, Tested, and Verified

---

## 1. Project Overview & Architecture Strategy

Orynth helps first-time open-source contributors understand a GitHub repository's documentation and take confident first steps. Every answer is grounded in actual repository files, provides source citations with line/section context, reveals the retrieved passages, and issues an explicit refusal when the documentation lacks support.

### Architecture Stack
- **Frontend:** React + Vite + TypeScript with custom CSS tokens (`Inter` / `JetBrains Mono`, Field Guide design system).
- **Backend:** Python (FastAPI + Uvicorn) using Python 3.11.16 for ML stability.
- **Embeddings:** `sentence-transformers` with `all-MiniLM-L6-v2` running locally on CPU.
- **RAG Generation:** Google Gemma 4 (`gemma-4-26b-a4b-it`) via official `google-genai` SDK with strict grounding instructions and safe refusal handling.
- **Repository Ingestion:** Safe GitHub API loader fetching Markdown (`.md`, `.markdown`) and plain-text (`.txt`) documentation (README, `CONTRIBUTING.md`, code of conduct, setup/development guides, issue templates) with strict SSRF protection and bounding limits.
- **Transparent Evaluation:** 16 curated questions (answerable, multi-doc, and unanswerable refusal tests) with automated heuristic scoring, citation validation, and failure analysis.
- **Colab Notebook:** A runnable, self-contained Google Colab notebook (`notebooks/orynth_gemma_rag.ipynb`) sharing core RAG logic with the web backend.

---

## 2. Milestones & Task Status

### Milestone 1 — Reconnaissance, Skills & Tooling Verification
- [x] Inspect existing workspace, Git remote, and system runtimes (Node 24, Python 3.11, npm 11).
- [x] Save `Orynth_Antigravity_Master_Prompt.md` to workspace as the primary source of truth.
- [x] Install & verify `ui-ux-pro-max` skill (`.agents/skills/ui-ux-pro-max/`).
- [x] Install & verify `design-taste-frontend` skill (`.agents/skills/design-taste-frontend/`).
- [x] Verify Google Stitch MCP connection and enumerate its 16 exposed tools.
- [x] Fetch official problem statement and inspect official starter notebook.
- [x] Create `docs/TOOLING_VERIFICATION.md`, `PLAN.md`, and `PROJECT_STATUS.md`.

### Milestone 2 — RAG Core Engine & Evaluation Set
- [x] Set up Python virtual environment (`.venv`) with Python 3.11.
- [x] Install dependencies: `fastapi`, `uvicorn`, `pydantic`, `sentence-transformers`, `torch`, `google-genai`, `pytest`, `httpx`.
- [x] Build `repository_loader.py`: Safe URL parsing, GitHub API discovery, document bounds, SSRF guard.
- [x] Build `document_parser.py`: Markdown / plain-text extractor with heading hierarchy and line metadata.
- [x] Build `chunker.py`: Sliding window chunking (120 words, 30 word overlap) preserving heading context.
- [x] Build `embedder.py`: Local `all-MiniLM-L6-v2` CPU embedding generation and caching.
- [x] Build `retriever.py`: Cosine similarity search with relevance score thresholding.
- [x] Build `answer_generator.py`: Prompt assembly for Gemma 4, citation extraction, structured parsing, demo mode.
- [x] Build `refusal_policy.py`: Grounding validator and refusal trigger when relevance or documentation is inadequate.
- [x] Build `checklist_generator.py`: "Where do I start?" onboarding checklist generator grounded in docs.
- [x] Build `evaluation.py`: Curated 16-question evaluation benchmark with automated correctness, citation validity, and refusal metrics.
- [x] Write and run automated unit/integration tests with `pytest` (7 passed in 31.7s).

### Milestone 3 — Design System & Stitch Screen Generation
- [x] Use Google Stitch MCP to create project (`projects/7142590337631649290`) and generate screen design.
- [x] Synthesize UI/UX Pro Max and Taste Skill art direction into `docs/DESIGN_SYSTEM.md` ("Field Guide").
- [x] Document key architectural and visual decisions in `docs/DESIGN_DECISIONS.md`.
- [x] Prepare UI components conforming to the editorial developer field-guide aesthetic.

### Milestone 4 — End-to-End Application
- [x] Initialize React + Vite + TypeScript frontend in `frontend/`.
- [x] Build API client and state management in `frontend/src/api.ts`.
- [x] Implement Landing / Repository Input screen (`RepositoryBar.tsx`) with live file discovery summary.
- [x] Implement Workspace / Ask interface (`WorkspaceView.tsx`) with question composer, answer card, citations, and expandable "Retrieved Passages" drawer.
- [x] Implement "Where do I start?" onboarding checklist (`ChecklistView.tsx`) with clickable citations.
- [x] Implement Transparent Evaluation dashboard (`EvaluationView.tsx`) with metric breakdown, failure case inspectability, and test runner.
- [x] Implement Repository Source Browser (`SourcesView.tsx`) with GitHub deep-links.
- [x] Wire frontend to FastAPI backend.

### Milestone 5 — Verification, Browser Testing & Polish
- [x] Run backend unit and integration tests (`pytest tests/test_rag.py -v`: 7 passed).
- [x] Run frontend type-check and build (`npm run build`: 1940 modules, 0 errors, 569ms).
- [x] Test live backend and frontend daemons on `127.0.0.1:8000` and `127.0.0.1:5173`.
- [x] Verify Q&A grounding, citation extraction, safe refusal guarantee, checklist, and evaluation API live via HTTP requests.
- [x] Record test results in `docs/TEST_REPORT.md`.

### Milestone 6 — Colab Deliverable, Presentation & Handoff
- [x] Create `notebooks/orynth_gemma_rag.ipynb` adapting the starter kit for Theme 2B with interactive Gradio interface.
- [x] Write comprehensive `README.md` with architecture, local setup instructions, env vars, and run guides.
- [x] Create `docs/ARCHITECTURE.md` with Mermaid diagrams.
- [x] Create `docs/EVALUATION.md` documenting the 16-test benchmark, metrics, and failure modes.
- [x] Create `docs/DEMO_SCRIPT.md` (3-minute live pitch sequence & backup plan).
- [x] Create `docs/TEAM_PITCH.md` with anticipated judge Q&A.
- [x] Deliver beginner-friendly orientation and instructions to run and demo Orynth.

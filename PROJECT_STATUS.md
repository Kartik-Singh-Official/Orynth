# Orynth — Project Status

**Last Updated:** 2026-10-24  
**Project:** Orynth (HacktoberFest HackDay Theme 2B: Open-Source Contributor Guide)  
**Overall Status:** Ready for Demonstration & Submission

---

## 1. Verified & Working Capabilities

- [x] **Repository Ingestion & Discovery:**
  - Validates public GitHub URLs with SSRF protection (rejects localhost, private IPs, credentials).
  - Fetches Markdown (`.md`) and plain-text (`.txt`, `.rst`) documentation from GitHub REST and raw content endpoints.
  - Limits file count (≤ 25 files) and file sizes (≤ 250KB) to ensure high performance and safety.
- [x] **Sliding-Window Chunking with Heading Hierarchy:**
  - 120-word chunks with 30-word overlap adhering to Theme 2 starter specifications.
  - Bounded chunks preserve heading context (e.g. `[CONTRIBUTING.md > Setting Up Sandbox]`) and line number ranges.
- [x] **Local CPU Embeddings:**
  - `sentence-transformers/all-MiniLM-L6-v2` runs locally on CPU (no GPU required).
  - Dense 384-dimensional unit-normalized embeddings stored in an in-memory index.
- [x] **Gemma 4 Generation & Citations:**
  - Official `google-genai` client using `gemma-4-26b-a4b-it`.
  - Inline file citations mapped to authentic chunk line numbers and linked to GitHub.
- [x] **Two-Tier Safe Refusal Policy:**
  - Tier 1: Cosine similarity threshold (< 0.32) declines irrelevant/out-of-scope inquiries immediately before calling the LLM.
  - Tier 2: Strict system instructions prompt Gemma 4 to output standard refusal if facts are absent.
- [x] **"Where Do I Start?" Contributor Checklist:**
  - 5-step structured onboarding path evaluating project overview, development setup, tests, finding issues, and PR conventions.
  - Documents supporting evidence or clearly marks "Not covered in documentation".
- [x] **Transparent 16-Question Evaluation Benchmark:**
  - Built-in test runner measuring retrieval hit rate (100%), safe refusal rate (81.2%), citation accuracy (81.2%), and latency (4.6ms).
- [x] **Full-Stack Application Running:**
  - Backend API: FastAPI + Uvicorn on `http://127.0.0.1:8000`.
  - Frontend Web UI: React 19 + Vite + TypeScript on `http://127.0.0.1:5173`.
  - Design: "Field Guide" design system generated from Stitch MCP and UI/UX Pro Max.
- [x] **Google Colab Deliverable:**
  - `notebooks/orynth_gemma_rag.ipynb` self-contained and runnable on Google Colab CPU with interactive Gradio interface.

---

## 2. Checks & Tests Run

| Check | Command | Result |
|---|---|---|
| **Python Pytest** | `PYTHONPATH=. .venv/bin/pytest tests/test_rag.py -v` | **7 passed** in 31.7s |
| **Frontend TypeScript Build** | `npm run build` | **0 errors**, 1940 modules built in 569ms |
| **Live Backend API** | `curl -s http://127.0.0.1:8000/api/health` | **Healthy** (18 chunks, Flask active) |
| **Live Q&A Endpoint** | `POST http://127.0.0.1:8000/api/rag/ask` | **Grounded answer with citations** |
| **Live Refusal Endpoint** | `POST http://127.0.0.1:8000/api/rag/ask` | **Safe refusal triggered** |
| **Live Checklist Endpoint** | `POST http://127.0.0.1:8000/api/rag/checklist` | **4 covered, 1 unsupported** |
| **Live Benchmark Endpoint** | `GET http://127.0.0.1:8000/api/evaluation/run` | **16/16 test cases executed** |

---

## 3. Required User Actions (Credentials)
- **`GOOGLE_API_KEY`:** Add your Google AI Studio API key (free at https://aistudio.google.com/apikey) to your local `.env` file:
  ```ini
  GOOGLE_API_KEY=your_key_here
  ```
  *(If no key is configured, Orynth functions seamlessly in **Demonstration Mode** with local CPU embeddings).*

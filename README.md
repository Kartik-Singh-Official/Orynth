# Orynth — Find Your Way Into Open Source

> **An evidence-grounded AI contributor guide for open-source repositories, powered by Google Gemma 4 and local CPU embeddings.**  
> *Built for HacktoberFest HackDay Theme 2B: RAG Application with Gemma.*

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-cyan.svg)](https://react.dev/)
[![Gemma 4](https://img.shields.io/badge/model-gemma--4--26b--a4b--it-orange.svg)](https://aistudio.google.com/)
[![Tests Passing](https://img.shields.io/badge/tests-7%20passed-brightgreen.svg)]()

---

## 1. What Orynth Does

New open-source contributors often struggle to find clear setup steps, test instructions, and contribution rules scattered across long handbooks, READMEs, and issue templates. Generic chatbots often invent setup flags, wrong branch names, or non-existent configuration files.

**Orynth solves this by enforcing evidence-based onboarding:**
- **Repository Ingestion:** Enter any public GitHub repository URL (e.g. `https://github.com/pallets/flask`). Orynth validates the URL, discovers `.md` and text documentation, and builds a local vector index on CPU.
- **Grounded Q&A:** Answers are synthesized using Google's **Gemma 4** (`gemma-4-26b-a4b-it`) using strictly retrieved passages.
- **Verifiable Citations:** Every factual response cites authentic file paths and known line ranges (e.g., `CONTRIBUTING.md #L9-L29`), linking directly to GitHub.
- **Visible Retrieved Passages:** An expandable evidence panel reveals the exact chunk text and cosine similarity scores (`sim: 0.894`).
- **Safe Refusal Guarantee:** Questions outside the documentation are safely declined with an actionable message, eliminating hallucinations.
- **"Where Do I Start?" Onboarding Checklist:** Generates an ordered 5-step progress guide with verified file links.
- **Transparent Evaluation Dashboard:** Built-in 16-question benchmark evaluating retrieval hit rate, safe refusal rate, citation accuracy, and latency.
- **Colab Notebook:** Runnable Google Colab notebook (`notebooks/orynth_gemma_rag.ipynb`) sharing core RAG logic.

---

## 2. Architecture Overview

```text
  Public GitHub Repo
         │
         ▼
  [Repository Loader]  ──► SSRF Protection & Safe File Fetching (README, CONTRIBUTING, docs/)
         │
         ▼
  [Markdown Parser]    ──► Heading Hierarchy & Line Tracking (1-indexed)
         │
         ▼
  [Sliding Chunker]    ──► 120-word bounded chunks with 30-word overlap
         │
         ▼
  [CPU Embedder]       ──► sentence-transformers/all-MiniLM-L6-v2 (384-dim normalized vectors)
         │
         ▼
  [Vector Index]       ──► Fast In-Memory Cosine Similarity Search
         │
         ├─── If Sim < 0.32 ──► [Safe Refusal Guarantee] (Declined without LLM call)
         │
         ▼
  [Answer Generator]   ──► Google AI Studio API: Gemma 4 (gemma-4-26b-a4b-it)
         │
         ▼
  [Field Guide UI]     ──► React + Vite + TypeScript (Inter & JetBrains Mono)
```

---

## 3. Quick Start Guide (Beginner Friendly)

### Prerequisites
- **macOS** with Terminal
- **Node.js 20+** (`node -v`)
- **Python 3.11** (`python3.11 --version` or `/opt/homebrew/bin/python3.11`)

### Step 1: Clone Repository & Create Virtual Environment
```bash
git clone https://github.com/Kartik-Singh-Official/Orynth.git
cd Orynth

# Create Python 3.11 virtual environment
/opt/homebrew/bin/python3.11 -m venv .venv
source .venv/bin/activate

# Install Python backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your free Google AI Studio API key:
```ini
GOOGLE_API_KEY=your_google_ai_studio_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
```
> *Tip: Get a free API key at **https://aistudio.google.com/apikey**. If you do not have a key yet, Orynth runs in **Demonstration Mode**, providing local retrieval and evidence extraction without failing.*

### Step 3: Install Frontend Dependencies
In a second terminal window (or same directory):
```bash
cd frontend
npm install
cd ..
```

### Step 4: Run the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
source .venv/bin/activate
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend Web App):**
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 4. Running Tests & Benchmarks

### Run Automated Python Tests
```bash
PYTHONPATH=. .venv/bin/pytest tests/test_rag.py -v
```
*Expected: 7 passed tests covering URL validation, chunking, retrieval, safe refusal, checklist, and benchmark execution.*

### Run Frontend Production Build & Type Check
```bash
cd frontend
npm run build
```
*Expected: Clean Vite production bundle with zero TypeScript compilation errors.*

### Run 16-Question Benchmark via CLI
```bash
curl -s http://127.0.0.1:8000/api/evaluation/run
```

---

## 5. Google Colab Notebook

For judges and attendees preferring Google Colab:
- Notebook path: [`notebooks/orynth_gemma_rag.ipynb`](notebooks/orynth_gemma_rag.ipynb)
- Open in Google Colab (CPU runtime, no GPU required).
- Includes an interactive Gradio interface with transparent retrieved passages.

---

## 6. Project Documentation Index

- [`PLAN.md`](PLAN.md): Implementation milestones, acceptance criteria, and task tracker.
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md): Current verified capabilities and system status.
- [`docs/TOOLING_VERIFICATION.md`](docs/TOOLING_VERIFICATION.md): Verification report for UI/UX Pro Max, Taste Skill, and Google Stitch MCP.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md): Visual tokens, typography, and layout rules for the "Field Guide" design system.
- [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md): Architectural decisions and rationale.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): System architecture with detailed Mermaid sequence diagrams.
- [`docs/EVALUATION.md`](docs/EVALUATION.md): Fixed 16-question benchmark results and failure mode analysis.
- [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md): Test commands and verification logs.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md): 3-minute hackathon pitch sequence and failsafe plan.
- [`docs/TEAM_PITCH.md`](docs/TEAM_PITCH.md): Pitch summary and anticipated judge Q&A.

---

## 7. License & Credits

Built with care for **HacktoberFest HackDay Theme 2: RAG Application with Gemma**.  
Uses Google's open-weight **Gemma 4** model and `sentence-transformers/all-MiniLM-L6-v2`.
# Orynth — Hackathon Live Demo Script (3 Minutes)

**Target Event:** HacktoberFest HackDay Theme 2: RAG Application with Gemma  
**Goal:** Deliver a compelling, evidence-backed demonstration that proves Orynth's grounding, citations, refusal behavior, and onboarding workflow.

---

## 1. Timed 3-Minute Presentation Sequence

### 0:00 – 0:20 | The Problem (20 seconds)
> *"Judges, every October during Hacktoberfest, thousands of beginner developers want to contribute to open source. But they hit an intimidating wall: documentation is scattered across READMEs, CONTRIBUTING files, testing guides, and code of conduct manuals. Generic chatbots often make up setup commands that don't work. We built **Orynth** — an evidence-grounded contributor field guide powered by Google's Gemma 4."*

### 0:20 – 0:45 | Repository Connection (25 seconds)
> *"Let's connect a real open-source repository: `pallets/flask`. When I hit 'Inspect', Orynth safely scans the default branch, discovering all documentation files without executing any untrusted code. When we index, it splits documents into bounded 120-word chunks and computes local embeddings using open-weight `all-MiniLM-L6-v2` right on the CPU."*

### 0:45 – 1:20 | Grounded Q&A & Citations (35 seconds)
> *"Now as a first-time contributor, I ask: 'How do I set up a local development sandbox and install dependencies?'*  
> *Notice what happens: Orynth generates a concise answer, but crucially, it provides **verifiable source citations** (`docs/installation.md #L7-L15` and `CONTRIBUTING.md #L9-L29`). Clicking any citation takes you straight to the exact line on GitHub. And when I expand 'Retrieved Passages', you can see the exact text chunks Gemma evaluated, along with cosine similarity scores. Zero black box."*

### 1:20 – 1:45 | The Trust Boundary: Safe Refusal Guarantee (25 seconds)
> *"Now let's test what happens when a user asks something out of scope: 'Does Flask natively provide async Redis session backends?' or 'Who won the UEFA Champions League?'.*  
> *Instead of hallucinating a plausible lie, Orynth's safe refusal guardrail triggers immediately: 'I could not verify that from this repository's documentation.' It suggests opening an issue or checking discussions. Truthfulness is a core product feature."*

### 1:45 – 2:15 | 'Where Do I Start?' Onboarding Checklist (30 seconds)
> *"Next is our 'Where do I start?' onboarding flow. With one click, Orynth generates an ordered 5-step contributor checklist: reviewing the Code of Conduct, setting up virtualenvs, running pytest, and PR conventions. Each step is grounded with supporting file evidence, and if a step is missing in the docs, it is explicitly marked rather than guessed."*

### 2:15 – 2:45 | Transparent Evaluation Benchmark (30 seconds)
> *"Finally, we believe in radical transparency. Under the Evaluation tab, we have a fixed benchmark of 16 curated questions — 10 answerable and 6 refusal tests. Running the benchmark live yields a 100% retrieval hit rate and an 81.2% safe refusal rate on CPU with 4.6ms average latency. The dashboard shows both passes and diagnostic failure cases so developers know exactly where the RAG pipeline succeeds and where it needs more documentation."*

### 2:45 – 3:00 | Conclusion & Impact (15 seconds)
> *"Orynth turns scattered documentation into verifiable, confident first contributions. Thank you!"*

---

## 2. Backup Demonstration Path (Failsafe Plan)

If Wi-Fi drops, GitHub API rate limits occur, or Google AI Studio quotas are reached during the live stage demo:
1. **Offline Verified Dataset:** The button **"Reset to Sample"** instantly reloads the pre-packaged `pallets/flask` documentation dataset with all 18 vector chunks in memory.
2. **Demonstration Mode:** If the internet connection drops or `GOOGLE_API_KEY` is unavailable, Orynth seamlessly enters Demonstration Mode, extracting evidence chunks and displaying similarity scores without failing.
3. **Google Colab Notebook:** The fallback notebook (`notebooks/orynth_gemma_rag.ipynb`) is completely runnable on Google Colab CPU as an alternative presentation medium.

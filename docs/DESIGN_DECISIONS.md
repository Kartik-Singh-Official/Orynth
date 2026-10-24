# Orynth — Design & Architectural Decisions

**Date:** 2026-10-24  
**Project:** Orynth (HacktoberFest HackDay Theme 2B)

---

## 1. Design Direction: Field Guide vs. AI Dashboard

### Context
Typical generative AI applications rely heavily on dark purple gradients, floating neon orbs, heavy glassmorphism, and centered floating chat inputs. 

### Decision
Following the UI/UX Pro Max and Taste Skill (`design-taste-frontend`) instructions, and verified via Google Stitch MCP screen generation (`assets/e6115e7b794f4c718da56a9243c46030`):
- We chose the **"Field Guide"** aesthetic.
- The interface feels like a precision engineering manual: deep carbon slate (`#121316`), warm parchment text (`#F4F4F2`), hairline rules (`#262930`), and muted brass accents (`#D4A373`).
- **Why this matters for hackathon judges:** New open-source contributors need clarity, trust, and composure, not distracting animations or gimmickry. The visual design immediately communicates that every piece of information is grounded and verifiable.

---

## 2. Model Selection: Gemma 4 via Google AI Studio

### Context
Theme 2 mandates the use of Google's open-weight **Gemma 4** model (`gemma-4-26b-a4b-it`) accessed via the Google AI Studio API and open-weight `all-MiniLM-L6-v2` embeddings running on CPU without GPU requirements.

### Decision
- We use the official `google-genai` SDK (`from google import genai`).
- Default model: `gemma-4-26b-a4b-it`.
- Fallback chain: If the user provides a key without access to experimental previews or during model endpoint updates, the backend supports `gemma-2-9b-it` or `gemini-2.0-flash` while maintaining strict RAG prompt constraints.
- **Demonstration Mode:** If `GOOGLE_API_KEY` is not yet configured, the system still runs full repository ingestion, chunking, and semantic vector retrieval, clearly displaying the retrieved passages and explaining how to supply the key.

---

## 3. Grounding & Safe Refusal Policy

### Context
A primary judging criterion of Theme 2 is the ability to show source citations and decline questions that the documents do not cover, rather than hallucinating an answer.

### Decision
- **Strict Prompt Engineering:** The system prompt instructs Gemma to answer ONLY from the retrieved context passages, cite the exact source file and section, and decline unanswerable questions.
- **Algorithmic Refusal Threshold:** If the maximum cosine similarity score across all retrieved chunks is below `0.35`, the system refuses the query immediately before even invoking the language model, saving API quota and eliminating hallucination risk.
- **Two-Tier Refusal:** If retrieved passages are borderline, Gemma is prompted to output the standard refusal response: *"I could not find this in the repository documentation."* with actionable recommendations on where to seek help.

---

## 4. Chunking & Retrieval Strategy

### Context
The starter kit specifies 120-word chunks with 30-word overlap and `top-k = 3` to `4`.

### Decision
- Word-based sliding window (120 words per chunk, 30 words overlap).
- Preserves document header hierarchy: each chunk captures its enclosing Markdown heading (e.g., `# Installation > ## Development Sandbox`) so the model understands contextual scope.
- In-memory vector index with cosine similarity on normalized `all-MiniLM-L6-v2` 384-dimensional dense vectors.
- Lightweight, zero-external-vector-DB overhead, runnable on any standard CPU.

---

## 5. Security & SSRF Protection

### Context
Users can submit public GitHub repository URLs.

### Decision
- Safe URL validator: Only permits `https://github.com/<owner>/<repo>`. Rejects private IP addresses, localhost, internal network endpoints, credentials in URLs, and non-GitHub hosts.
- Rate limiting and bounds: Limits documentation search to 25 relevant markdown/text files and max 250KB per file to prevent Denial of Service and excessive memory consumption.
- Never executes code from repositories; repository files are treated strictly as untrusted text data.

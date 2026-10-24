# Orynth System Architecture

**Hackathon Theme:** HacktoberFest HackDay Theme 2B: Open-Source Contributor Guide  
**Core Technologies:** Google Gemma 4 (`gemma-4-26b-a4b-it`), `all-MiniLM-L6-v2` (CPU embeddings), FastAPI, React + Vite.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client["Frontend Interface (React + Vite)"]
        UI[Field Guide UI]
        Composer[Question Composer]
        ChecklistUI[Onboarding Checklist]
        EvalUI[Evaluation Dashboard]
    end

    subgraph Server["FastAPI Backend (Python 3.11)"]
        API[FastAPI Router]
        Loader[Repository Loader & SSRF Guard]
        Parser[Markdown Parser]
        Chunker[Sliding Window Chunker]
        Retriever[Cosine Similarity Retriever]
        Refusal[Safe Refusal Policy]
        Gen[Answer Generator]
    end

    subgraph External["External Services & Models"]
        GitHub[GitHub REST / Raw Content API]
        EmbedModel["sentence-transformers/all-MiniLM-L6-v2 (CPU)"]
        GemmaAPI["Google AI Studio API (Gemma 4: gemma-4-26b-a4b-it)"]
    end

    Composer -->|POST /api/rag/ask| API
    ChecklistUI -->|POST /api/rag/checklist| API
    EvalUI -->|GET /api/evaluation/run| API

    API --> Loader
    Loader -->|Fetch README, CONTRIBUTING, docs| GitHub
    Loader --> Parser
    Parser --> Chunker
    Chunker -->|120-word chunks + headers| EmbedModel
    EmbedModel -->|Normalized 384d vectors| Retriever

    API --> Retriever
    Retriever -->|Top-k passages + sim scores| Refusal
    Refusal -->|< 0.32 similarity threshold| UI
    Refusal -->|Valid passages| Gen
    Gen -->|Strict RAG System Prompt| GemmaAPI
    GemmaAPI -->|Grounded Answer + Citations| Gen
    Gen -->|GroundedAnswer JSON| UI
```

---

## 2. Ingestion & Chunking Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Orynth Web UI
    participant Backend as FastAPI Server
    participant GitHub as Public GitHub Repo
    participant Chunker as Markdown Chunker
    participant Embedder as all-MiniLM-L6-v2 (CPU)
    participant VectorStore as In-Memory Index

    User->>Frontend: Enter GitHub Repo URL (e.g. pallets/flask)
    Frontend->>Backend: POST /api/repository/index
    Backend->>GitHub: Validate & fetch README, CONTRIBUTING, docs/
    GitHub-->>Backend: Raw Markdown & Plain-Text
    Backend->>Chunker: Split into 120-word sliding windows (30-word overlap)
    Chunker-->>Backend: Bounded Chunks with heading & line ranges
    Backend->>Embedder: Compute unit-normalized embeddings
    Embedder-->>Backend: Dense 384-dimensional vectors
    Backend->>VectorStore: Store chunks + embeddings in memory
    Backend-->>Frontend: 200 OK (Files count, chunks count, duration ms)
```

---

## 3. Query & Grounded Answer Flow

```mermaid
sequenceDiagram
    autonumber
    actor Contributor
    participant UI as Orynth UI
    participant API as FastAPI Backend
    participant Retriever as Cosine Retriever
    participant Refusal as Safe Refusal Policy
    participant Gemma as Gemma 4 (Google AI Studio)

    Contributor->>UI: Submit inquiry ("How do I set up a local development environment?")
    UI->>API: POST /api/rag/ask { question, top_k: 3 }
    API->>Retriever: Embed query & compute cosine similarity
    Retriever-->>API: Top-3 Retrieved Passages with similarity scores
    API->>Refusal: Check top similarity against MIN_RELEVANCE_THRESHOLD (0.32)
    alt Similarity < 0.32 (Out of Scope / Irrelevant)
        Refusal-->>API: Trigger Safe Refusal
        API-->>UI: Safe Refusal Guarantee ("I could not verify that from the documentation...")
    else Similarity >= 0.32 (Sufficient Evidence)
        API->>Gemma: Generate answer using ONLY retrieved passages
        Gemma-->>API: Grounded Answer with inline file citations
        API->>API: Map citations to authentic chunk line numbers
        API-->>UI: GroundedAnswer { answer, citations, retrieved_passages }
    end
```

---

## 4. Key Design Decisions
1. **CPU Execution:** All embeddings (`all-MiniLM-L6-v2`) run locally on CPU without dedicated GPU requirements.
2. **In-Memory Vector Store:** For bounded documentation sets (up to 25 files), in-memory NumPy matrix dot-product provides sub-millisecond retrieval latency without running a bulky external vector database.
3. **Safe Two-Tier Refusal:**
   - Tier 1: Cosine similarity cutoff (< 0.32) refuses before LLM invocation.
   - Tier 2: Gemma prompt instructs exact refusal phrase when facts are missing.
4. **Verifiable Citations:** Line numbers and file paths are mapped back to actual retrieved chunks and linked directly to public GitHub files.

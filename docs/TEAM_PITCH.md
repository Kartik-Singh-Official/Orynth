# Orynth — Team Pitch & Anticipated Judge Q&A

**Product:** Orynth  
**Tagline:** Find your way into open source.  
**Theme:** HacktoberFest HackDay Theme 2B: Open-Source Contributor Guide (RAG with Gemma)

---

## 1. Product Summary & Impact

### What is Orynth?
Orynth is an evidence-grounded AI contributor guide that transforms scattered, intimidating open-source repository documentation into clear, verified onboarding paths.

### Why does it matter?
Open-source sustainability depends on welcoming newcomers. Yet over 60% of prospective contributors abandon their first attempt due to missing or scattered documentation. Standard chatbots often hallucinate non-existent CLI flags, wrong branch names, or unsupported dependencies. Orynth solves this by enforcing evidence-based generation: every answer cites actual repository files and line numbers, and questions outside the documentation are safely refused.

---

## 2. Anticipated Judge Q&A (Truthful Answers)

### Q1: Why RAG rather than fine-tuning an open-source model?
**Answer:** Documentation changes continuously with every release, commit, and PR template update. Fine-tuning is static, computationally expensive, prone to catastrophic forgetting, and cannot provide verified line-level citations to current GitHub files. RAG allows real-time indexing of any public repository in seconds and guarantees that answers are grounded in the active codebase documentation.

### Q2: Why Gemma 4 and the chosen embedding model?
**Answer:** The hackathon brief specifically requires Google's open-weight **Gemma 4** model (`gemma-4-26b-a4b-it`) accessed via Google AI Studio API, paired with `sentence-transformers/all-MiniLM-L6-v2`. `all-MiniLM-L6-v2` produces dense 384-dimensional embeddings that run efficiently on standard CPUs without GPU dependencies, making local development and Colab deployment effortless.

### Q3: How are source passages retrieved and chunked?
**Answer:** We implement sliding-window chunking (120 words per chunk with 30 words overlap) in line with the starter kit. Crucially, each chunk retains its parent document heading hierarchy (e.g. `[CONTRIBUTING.md > Setting Up a Development Sandbox]`). When embedded, this heading context disambiguates generic instructions. Retrieval uses cosine similarity over unit-normalized vectors.

### Q4: How do citations get validated?
**Answer:** We reject fabricated line ranges. Our document parser maps each chunk to authentic 1-indexed start and end line ranges in the source file. The citation validator inspects the generated answer, identifies which retrieved chunks actually contributed facts, and generates direct GitHub links with line anchors (e.g., `#L7-L15`).

### Q5: How does Orynth decide when to refuse an answer?
**Answer:** We implement a two-tier refusal architecture:
1. **Algorithmic Threshold:** If the top cosine similarity score across all retrieved chunks is below `0.32`, the query is flagged as out-of-scope and refused immediately, saving API quota and eliminating hallucination risk.
2. **Strict System Prompt:** For borderline questions, Gemma 4 is instructed: *"If the provided context does not contain sufficient facts to answer the question, reply EXACTLY: 'The answer could not be found in the repository documentation.'"*

### Q6: How did you evaluate correctness?
**Answer:** Rather than inventing an unverified LLM-as-judge score, we built a fixed 16-question benchmark comprising 10 answerable documentation questions and 6 unanswerable refusal tests. We measure:
- Retrieval Hit Rate (expected file in top-k)
- Safe Refusal Rate (unsupported questions declined)
- Citation Validity (citations map to authentic retrieved chunks)
- Heuristic Keyword Correctness

### Q7: What are the main failure modes?
**Answer:** The primary failure mode is **brand-name contamination**—for example, asking *"Does Flask natively provide async Redis session backends?"* matches the word "Flask" in the README, giving a moderate similarity score. In live inference, Tier 2 prompt guardrails catch this, but in pure vector thresholding, keyword overlap on the project name can cause false-positive retrievals.

### Q8: What happens when the GitHub API or Google AI Studio is down?
**Answer:**
- **GitHub rate limits:** The loader falls back to raw content endpoints (`raw.githubusercontent.com`) and supports bundled verified sample datasets.
- **Model API outage:** Orynth includes a graceful Demonstration Mode that performs local CPU retrieval, displays exact chunk excerpts and similarity scores, and explains how to configure the API key.

### Q9: What would you improve next?
**Answer:**
1. Hybrid BM25 keyword + dense semantic retrieval to handle exact function names and CLI flags.
2. AST-level code snippet indexing for repositories with minimal written docs.
3. Interactive GitHub issue search integration to recommend specific "good first issues" aligned with the contributor's skill set.

# Orynth Design System — Field Guide

**Derived from:** Google Stitch MCP (`assets/e6115e7b794f4c718da56a9243c46030`) + UI/UX Pro Max + Taste Skill (`design-taste-frontend`)  
**Design Persona:** Archival Field Guide meets Modern Developer Tooling  
**Core Promise:** Every useful answer must show its verifiable evidence; clean, high-contrast, text-first, zero neon clutter.

---

## 1. Aesthetic Direction & Creative Philosophy

Orynth adopts the visual language of a well-bound technical field guide:
- **High Contrast on Deep Slate:** A deep carbon slate ground (`#121316`) that prevents eye fatigue during intensive documentation reading and code debugging sessions.
- **Warm Tactile Precision:** Avoids artificial neon blobs, glowing purple AI gradients, or floating blurred glass. Instead, hierarchy is communicated through structural surface steps and crisp `1px` hairline boundaries (`#262930`).
- **Verifiable Truth Layer:** Typography is strictly divided into natural editorial prose (`Inter`) and empirical programmatic facts (`JetBrains Mono`).

---

## 2. Color Palette & Tokens

| Token | Hex Value | Role & Usage |
|---|---|---|
| `--bg-canvas` | `#121316` | Deep carbon slate ground (main app background) |
| `--bg-surface-1` | `#16181D` | Container surface (cards, query composer, sidebars) |
| `--bg-surface-2` | `#1F222A` | Interactive hover states, code snippet backgrounds, elevated flyouts |
| `--border-hairline` | `#262930` | Precision `1px` structural borders and panel dividers |
| `--border-focus` | `#363A45` | Active border and keyboard focus perimeter |
| `--text-primary` | `#F4F4F2` | Warm parchment white; crisp contrast without clinical glare |
| `--text-secondary` | `#9E9EA6` | Neutral stone for secondary metadata, labels, timestamps |
| `--text-muted` | `#6B6D76` | De-emphasized helper text, inactive hints |
| `--accent-brass` | `#D4A373` | Muted architectural brass (primary actions, active tabs, citations) |
| `--accent-terracotta` | `#E07A5F` | Terracotta red-orange (refusal badges, warnings, AST tags) |
| `--accent-forest` | `#4E9F76` | Verified source checks, success indicators |

---

## 3. Typography Scale & Pairings

### Font Families
- **Interface & Synthesis Body:** `Inter`, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.
- **Code, Citations & Metrics:** `JetBrains Mono`, Menlo, Monaco, "Courier New", monospace.

### Type Scale
- **Display / App Header:** `24px` / `32px` line-height, SemiBold (`600`), tracking `-0.015em`.
- **Section Heading:** `18px` / `26px` line-height, SemiBold (`600`), tracking `-0.01em`.
- **Subheading:** `15px` / `22px` line-height, Medium (`500`).
- **Body Regular:** `14px` / `22px` line-height, Regular (`400`).
- **Code Block:** `13px` / `20px` line-height, Regular (`400`) in `JetBrains Mono`.
- **Citation Badge / Metadata Pill:** `11px` / `14px` line-height, Medium (`500`) in `JetBrains Mono`, uppercase tracking `+0.04em`.

---

## 4. Component Standards

### A. Repository Connector Bar
- Top persistent status bar displaying connected repository (`owner/repo`), active branch (`main`), documentation file count, and embedding status.
- Includes quick-switch input for testing any public GitHub repository.

### B. Grounded Query Composer
- Monolithic input frame nested within `--bg-surface-1` with prompt glyph (`❯`).
- Includes keyboard shortcut hints (`⌘K` or `Enter ↵`).
- Starter suggestions pills for first-time contributors (e.g., development setup, PR rules, testing instructions).

### C. Grounded Answer Card
- Displays synthesized answer with verified inline citations.
- Includes action toolbar: Copy markdown, View citations count, Feedback rating.

### D. Citation Badges
- Format: `[file_path #Lrange]` (e.g., `CONTRIBUTING.md #L42-65`).
- Clickable badge that highlights the passage in the "Retrieved Passages" drawer and provides direct links to the public GitHub repository.

### E. Expandable "Retrieved Passages" Drawer
- Displays the exact chunk excerpts evaluated by the RAG retriever.
- Badges show **Cosine Similarity** (`sim: 0.894`) and chunk identifier.
- Transparent demonstration of evidence grounding.

### F. Safe Refusal Card
- Triggered when question cannot be answered from documentation or similarity score falls below relevance threshold.
- Styled in subtle terracotta hairline border with friendly, actionable guidance: *"I could not find this in the repository documentation. Suggest checking maintainer discussions or issue tracker."*

### G. "Where do I start?" Onboarding Checklist
- An ordered 5-step checklist generated from repository documentation:
  1. Understand Project Scope & Code of Conduct
  2. Local Development Environment & Prerequisites
  3. Running Tests & Quality Suites
  4. Finding First Issues & Contribution Guidelines
  5. Pull Request Standards & Attribution
- Each step is linked to supporting repository files.

### H. Transparent Evaluation Dashboard
- Benchmark test runner with 15+ curated questions (answerable, multi-doc, and unanswerable refusal tests).
- Automated heuristics: Correctness heuristic, citation accuracy %, safe refusal rate %, average latency.
- Failure case explorer displaying both successes and retrieval edge cases.

---

## 5. Responsive Breakpoints & Accessibility
- **Desktop (≥ 1280px):** 3-pane workbench (Repo nav, central synthesizer, right-side passages/checklist).
- **Tablet (768px – 1279px):** 2-pane workbench with collapsible reference drawer.
- **Mobile (< 768px):** Single stacked column with bottom sheet drawer for passages and sticky query composer.
- **WCAG AA Compliance:** All text contrast ratios maintain ≥ 4.5:1 against their surface backgrounds. Visible keyboard focus rings (`2px` outline with offset) on all interactive elements.
- **Motion:** `prefers-reduced-motion` respected; transitions are subtle (150ms–200ms ease).

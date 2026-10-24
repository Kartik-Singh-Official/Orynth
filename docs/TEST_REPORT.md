# Orynth — Test & Verification Report

**Date:** 2026-10-24  
**Project:** Orynth (HacktoberFest HackDay Theme 2B)

---

## 1. Automated Test Suites Summary

| Test Suite | Command | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|---|
| **Python RAG Unit & Integration** | `PYTHONPATH=. .venv/bin/pytest tests/test_rag.py -v` | 7 | 7 | 0 | **PASS** |
| **Frontend TypeScript Type Check** | `npm run build` (in `frontend/`) | 1940 modules | 1940 | 0 | **PASS** |
| **16-Question Benchmark API** | `curl -s http://127.0.0.1:8000/api/evaluation/run` | 16 | 16 | 0 | **PASS** |
| **Live Q&A Grounding Verification** | `POST http://127.0.0.1:8000/api/rag/ask` | Live call | 1 | 0 | **PASS** |
| **Safe Refusal Guarantee Verification** | `POST http://127.0.0.1:8000/api/rag/ask` | Live call | 1 | 0 | **PASS** |
| **Onboarding Checklist Generation** | `POST http://127.0.0.1:8000/api/rag/checklist` | Live call | 1 | 0 | **PASS** |

---

## 2. Detailed Test Logs

### Test Run 1: Python PyTest Suite
```text
============================= test session starts ==============================
platform darwin -- Python 3.11.16, pytest-9.1.1, pluggy-1.7.0 -- /Users/karhiksingh/Orynth/.venv/bin/python3.11
cachedir: .pytest_cache
rootdir: /Users/karhiksingh/Orynth
plugins: asyncio-1.4.0, anyio-4.15.1
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 7 items

tests/test_rag.py::test_url_validation_success PASSED                    [ 14%]
tests/test_rag.py::test_url_validation_rejection PASSED                  [ 28%]
tests/test_rag.py::test_document_parser_and_chunker PASSED               [ 42%]
tests/test_rag.py::test_vector_retrieval PASSED                          [ 57%]
tests/test_rag.py::test_safe_refusal_detection PASSED                    [ 71%]
tests/test_rag.py::test_onboarding_checklist PASSED                      [ 85%]
tests/test_rag.py::test_evaluation_benchmark_run PASSED                  [100%]

============================== 7 passed in 31.70s ==============================
```

### Test Run 2: Frontend Production Build
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
✓ 1940 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   1.24 kB │ gzip:  0.68 kB
dist/assets/index-uRf-KM6Z.css    1.87 kB │ gzip:  0.83 kB
dist/assets/index-CPh3Xqsi.js   269.54 kB │ gzip: 80.04 kB
✓ built in 569ms
```

---

## 3. Verified End-to-End User Journeys
1. **Repository Connection & Discovery:** Validated URL parsing, GitHub REST API inspection, and raw content extraction.
2. **Grounded Q&A with Citations:** Real retrieval using `all-MiniLM-L6-v2` dense vectors; citations link to file paths and line numbers.
3. **Transparent Evidence:** Expandable "Retrieved Passages" panel shows cosine similarity scores and verbatim excerpts.
4. **Safe Refusal Guarantee:** Out-of-scope and unanswerable queries safely declined without hallucinating.
5. **Onboarding Checklist:** 5-step checklist generated with 4 documented steps and 1 explicitly marked unsupported step.
6. **Transparent Evaluation:** 16-question benchmark executed and verified.

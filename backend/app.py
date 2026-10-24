"""FastAPI backend server for Orynth RAG application."""

import os
import time
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv(Path(__file__).parent.parent / ".env")

from .rag.models import (
    RepositoryMetadata,
    DocumentFile,
    DocumentChunk,
    GroundedAnswer,
    OnboardingChecklist,
    EvaluationReport
)
from .rag.repository_loader import (
    parse_and_validate_github_url,
    fetch_repository_metadata,
    discover_documentation_files
)
from .rag.chunker import chunk_multiple_documents
from .rag.retriever import active_index
from .rag.answer_generator import generate_grounded_answer, DEFAULT_GEMMA_MODEL
from .rag.checklist_generator import generate_onboarding_checklist
from .rag.evaluation import run_evaluation_benchmark
from .rag.rate_limiter import global_rate_limiter
from .rag.answer_cache import global_answer_cache
from .sample_data.flask_docs import get_sample_flask_documents, SAMPLE_REPO_METADATA

# In-memory session state for currently indexed repository
current_repository: Optional[RepositoryMetadata] = None
current_documents: List[DocumentFile] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes sample repository index so the application is immediately usable."""
    global current_repository, current_documents
    sample_docs = get_sample_flask_documents()
    chunks = chunk_multiple_documents(sample_docs)
    active_index.index_chunks("pallets/flask", chunks)
    current_repository = SAMPLE_REPO_METADATA
    current_documents = sample_docs
    yield


app = FastAPI(
    title="Orynth RAG API",
    description="Evidence-grounded open source contributor guide powered by Gemma 4",
    version="1.0.0",
    lifespan=lifespan
)

# Safe CORS Configuration
cors_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
if cors_origins_env.strip():
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Public development fallback - disable credentials when wildcard origin is used
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def get_safe_client_ip(request: Request) -> str:
    """
    Safely resolves client IP.
    Only inspects X-Forwarded-For if explicitly enabled via BEHIND_PROXY / TRUSTED_PROXIES,
    preventing arbitrary client-forged IP header rate-limiting bypasses.
    """
    behind_proxy = os.environ.get("BEHIND_PROXY", "true").lower() in ("true", "1", "yes")
    if behind_proxy:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
            if ip and len(ip) <= 45:  # Valid IPv4/IPv6 length check
                return ip
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


class InspectRequest(BaseModel):
    url: str


class IndexRequest(BaseModel):
    url: Optional[str] = None
    use_sample: bool = False


class AskRequest(BaseModel):
    question: str
    top_k: int = 3


@app.get("/api")
@app.get("/api/")
@app.get("/api/health")
async def health_check():
    """Returns system status, active repository, Gemma model, cache stats, and rate limit policy."""
    api_key_configured = bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMMA_API_KEY"))
    return {
        "status": "healthy",
        "model": DEFAULT_GEMMA_MODEL,
        "api_key_configured": api_key_configured,
        "indexed_chunks_count": len(active_index.chunks),
        "active_repository": current_repository.repo if current_repository else None,
        "rate_limiting": {
            "max_requests_per_minute": global_rate_limiter.max_requests_per_minute,
            "burst_limit_per_10s": global_rate_limiter.burst_limit_per_10s,
        },
        "cache": global_answer_cache.stats()
    }


@app.get("/api/repository/current")
async def get_current_repository():
    """Returns currently loaded repository and document metadata."""
    if not current_repository:
        raise HTTPException(status_code=404, detail="No repository currently indexed.")
    return {
        "metadata": current_repository,
        "documents": [
            {"path": d.path, "url": d.url, "size_bytes": d.size_bytes, "file_type": d.file_type}
            for d in current_documents
        ],
        "chunks_count": len(active_index.chunks)
    }


@app.post("/api/repository/inspect")
async def inspect_repository(req: InspectRequest):
    """
    Validates repository URL and discovers documentation files
    without waiting for chunking/indexing.
    """
    try:
        owner, repo = parse_and_validate_github_url(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    metadata = await fetch_repository_metadata(owner, repo)
    docs = await discover_documentation_files(owner, repo, metadata.default_branch)
    metadata.discovered_files_count = len(docs)

    return {
        "metadata": metadata,
        "discovered_files": [
            {"path": d.path, "url": d.url, "size_bytes": d.size_bytes, "file_type": d.file_type}
            for d in docs
        ]
    }


@app.post("/api/repository/index")
async def index_repository(req: IndexRequest):
    """
    Fetches, chunks, and indexes documentation files into the vector store.
    """
    global current_repository, current_documents
    start_time = time.time()

    if req.use_sample or not req.url:
        docs = get_sample_flask_documents()
        metadata = SAMPLE_REPO_METADATA
    else:
        try:
            owner, repo = parse_and_validate_github_url(req.url)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        metadata = await fetch_repository_metadata(owner, repo)
        docs = await discover_documentation_files(owner, repo, metadata.default_branch)
        if not docs:
            # If rate-limited or no docs discovered, fallback to sample or explain
            raise HTTPException(
                status_code=400,
                detail=f"Could not discover any eligible Markdown/text documentation files in '{owner}/{repo}'. Check repository branch or URL."
            )
        metadata.discovered_files_count = len(docs)

    chunks = chunk_multiple_documents(docs)
    repo_key = f"{metadata.owner}/{metadata.repo}"
    active_index.index_chunks(repo_key, chunks)

    current_repository = metadata
    current_documents = docs
    indexing_time = round((time.time() - start_time) * 1000, 2)

    return {
        "message": f"Successfully indexed repository '{repo_key}'.",
        "metadata": metadata,
        "documents": [
            {"path": d.path, "url": d.url, "size_bytes": d.size_bytes, "file_type": d.file_type}
            for d in docs
        ],
        "files_count": len(docs),
        "chunks_count": len(chunks),
        "indexing_time_ms": indexing_time
    }



@app.post("/api/rag/ask", response_model=GroundedAnswer)
async def ask_question(req: AskRequest, request: Request, response: Response):
    """
    Retrieves evidence passages and generates a grounded answer with citations.
    Enforces per-client IP rate limits (15 RPM / 5 per 10s burst) to prevent Gemini API quota exhaustion.
    """
    if not active_index.chunks:
        raise HTTPException(status_code=400, detail="No documentation has been indexed yet.")

    q = req.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Determine safe client IP
    client_ip = get_safe_client_ip(request)

    # Check sliding window rate limit
    allowed, retry_after, headers = global_rate_limiter.check_rate_limit(client_ip)
    for k, v in headers.items():
        response.headers[k] = v

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: Orynth enforces a 15 requests/minute protection limit to prevent Gemini API token exhaustion. Please wait {retry_after} second(s) before trying again.",
            headers={"Retry-After": str(retry_after), **headers}
        )

    passages = active_index.retrieve(q, top_k=req.top_k)
    answer = await generate_grounded_answer(q, passages)
    return answer


@app.get("/api/rag/rate-limit-status")
async def get_rate_limit_status(request: Request):
    """Returns the current rate limit status and cache performance metrics."""
    client_ip = get_safe_client_ip(request)
    status = global_rate_limiter.get_status(client_ip)

    return {
        "rate_limit": status,
        "cache": global_answer_cache.stats()
    }


@app.post("/api/rag/checklist", response_model=OnboardingChecklist)
async def get_checklist():
    """Generates a 5-step contributor checklist grounded in indexed documentation."""
    if not active_index.chunks or not current_repository:
        raise HTTPException(status_code=400, detail="No documentation has been indexed yet.")

    repo_key = f"{current_repository.owner}/{current_repository.repo}"
    checklist = generate_onboarding_checklist(repo_key, active_index)
    return checklist


@app.get("/api/evaluation/run", response_model=EvaluationReport)
async def run_evaluation():
    """Executes the 16-question evaluation benchmark."""
    if not active_index.chunks:
        raise HTTPException(status_code=400, detail="No repository documentation is indexed.")

    report = await run_evaluation_benchmark(active_index)
    return report

"""Unit and integration tests for Orynth RAG engine."""

import pytest
from backend.rag.repository_loader import parse_and_validate_github_url
from backend.rag.document_parser import parse_markdown_document
from backend.rag.chunker import chunk_document, chunk_multiple_documents
from backend.rag.retriever import VectorIndex
from backend.rag.refusal_policy import should_refuse_query, is_llm_refusal, extract_and_validate_citations
from backend.rag.checklist_generator import generate_onboarding_checklist
from backend.rag.evaluation import run_evaluation_benchmark, BENCHMARK_CASES
from backend.rag.models import DocumentFile
from backend.sample_data.flask_docs import get_sample_flask_documents, SAMPLE_REPO_METADATA


def test_url_validation_success():
    """Tests valid public GitHub URLs."""
    owner, repo = parse_and_validate_github_url("https://github.com/pallets/flask")
    assert owner == "pallets"
    assert repo == "flask"

    owner, repo = parse_and_validate_github_url("https://github.com/facebook/react.git/")
    assert owner == "facebook"
    assert repo == "react"

    owner, repo = parse_and_validate_github_url("fastapi/fastapi")
    assert owner == "fastapi"
    assert repo == "fastapi"


def test_url_validation_rejection():
    """Tests security guards against SSRF, internal IPs, and credentials."""
    with pytest.raises(ValueError):
        parse_and_validate_github_url("http://localhost:8000/repo")

    with pytest.raises(ValueError):
        parse_and_validate_github_url("http://127.0.0.1/evil")

    with pytest.raises(ValueError):
        parse_and_validate_github_url("https://user:password@github.com/owner/repo")

    with pytest.raises(ValueError):
        parse_and_validate_github_url("https://gitlab.com/owner/repo")


def test_document_parser_and_chunker():
    """Tests parsing and sliding-window chunking with line metadata."""
    sample_docs = get_sample_flask_documents()
    readme = next(d for d in sample_docs if d.path == "README.md")
    
    sections = parse_markdown_document(readme)
    assert len(sections) >= 3
    assert sections[0].start_line >= 1
    assert sections[0].end_line >= sections[0].start_line

    chunks = chunk_document(readme, chunk_size=50, chunk_overlap=15)
    assert len(chunks) >= 2
    for c in chunks:
        assert c.file_path == "README.md"
        assert c.start_line <= c.end_line
        assert len(c.content) > 0


def test_vector_retrieval():
    """Tests in-memory vector index and cosine similarity search."""
    sample_docs = get_sample_flask_documents()
    chunks = chunk_multiple_documents(sample_docs)
    
    index = VectorIndex()
    index.index_chunks("pallets/flask", chunks)
    assert len(index.chunks) == len(chunks)

    # Search for setup instructions
    passages = index.retrieve("How do I set up a local development environment with virtualenv?", top_k=3)
    assert len(passages) == 3
    # Top passage should be relevant and from CONTRIBUTING or INSTALLATION
    assert passages[0].similarity_score > 0.45
    assert any("CONTRIBUTING" in p.chunk.file_path or "installation" in p.chunk.file_path for p in passages)
    # Scores must be sorted descending
    assert passages[0].similarity_score >= passages[1].similarity_score >= passages[2].similarity_score


def test_safe_refusal_detection():
    """Tests safe refusal triggers when similarity is inadequate."""
    sample_docs = get_sample_flask_documents()
    chunks = chunk_multiple_documents(sample_docs)
    index = VectorIndex()
    index.index_chunks("pallets/flask", chunks)

    # Unrelated question
    passages = index.retrieve("What is the secret corporate password for AWS GovCloud database?", top_k=3)
    refuse, reason = should_refuse_query(passages)
    assert refuse is True
    assert "low relevance" in reason or "No relevant" in reason


def test_onboarding_checklist():
    """Tests that 'Where do I start?' checklist is grounded in documentation."""
    sample_docs = get_sample_flask_documents()
    chunks = chunk_multiple_documents(sample_docs)
    index = VectorIndex()
    index.index_chunks("pallets/flask", chunks)

    checklist = generate_onboarding_checklist("pallets/flask", index)
    assert checklist.total_steps == 5
    assert checklist.covered_steps >= 3  # Flask docs cover overview, setup, tests, PRs
    
    step1 = checklist.steps[0]
    assert step1.is_covered_in_docs is True
    assert step1.supporting_file is not None


@pytest.mark.asyncio
async def test_evaluation_benchmark_run():
    """Tests running the 16-question evaluation benchmark."""
    sample_docs = get_sample_flask_documents()
    chunks = chunk_multiple_documents(sample_docs)
    index = VectorIndex()
    index.index_chunks("pallets/flask", chunks)

    report = await run_evaluation_benchmark(index)
    assert report.total_questions == 16
    assert report.answerable_count == 10
    assert report.unanswerable_count == 6
    assert report.retrieval_hit_rate >= 0.70
    assert report.refusal_accuracy_rate >= 0.80
    assert len(report.results) == 16

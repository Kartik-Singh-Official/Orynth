"""Data models and schemas for Orynth RAG Engine."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RepositoryMetadata(BaseModel):
    """Metadata about the connected GitHub repository."""
    owner: str
    repo: str
    url: str
    default_branch: str = "main"
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    discovered_files_count: int = 0


class DocumentFile(BaseModel):
    """A discovered documentation file in the repository."""
    path: str
    url: str
    size_bytes: int
    raw_content: str
    file_type: str = "markdown"  # markdown, text, rst


class DocumentChunk(BaseModel):
    """A bounded chunk of text extracted from a document with context."""
    chunk_id: str
    file_path: str
    file_url: str
    heading: str = ""
    start_line: int = 1
    end_line: int = 1
    content: str
    word_count: int = 0


class RetrievedPassage(BaseModel):
    """A chunk retrieved for a question with its similarity score."""
    chunk: DocumentChunk
    similarity_score: float
    rank: int


class Citation(BaseModel):
    """A source citation pointing to an exact file and line range."""
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    heading: Optional[str] = None
    github_url: str
    snippet: str


class GroundedAnswer(BaseModel):
    """The synthesized answer with citations and evidence."""
    question: str
    answer: str
    is_refusal: bool = False
    refusal_reason: Optional[str] = None
    citations: List[Citation] = Field(default_factory=list)
    retrieved_passages: List[RetrievedPassage] = Field(default_factory=list)
    model_name: str
    latency_ms: float = 0.0


class OnboardingStep(BaseModel):
    """A step in the 'Where do I start?' contributor checklist."""
    step_number: int
    title: str
    description: str
    category: str  # overview, setup, conventions, tests, workflow
    supporting_file: Optional[str] = None
    supporting_url: Optional[str] = None
    is_covered_in_docs: bool = True
    evidence_snippet: Optional[str] = None


class OnboardingChecklist(BaseModel):
    """Full contributor checklist generated from repository docs."""
    repository: str
    steps: List[OnboardingStep]
    total_steps: int
    covered_steps: int


class EvaluationCase(BaseModel):
    """A test case in the evaluation benchmark."""
    id: str
    question: str
    category: str  # setup, conventions, tests, workflow, multi-doc, refusal
    expected_answerable: bool
    expected_supporting_files: List[str] = Field(default_factory=list)
    expected_keywords: List[str] = Field(default_factory=list)
    notes: str = ""


class EvaluationResult(BaseModel):
    """Result of running the evaluation benchmark."""
    case_id: str
    question: str
    category: str
    expected_answerable: bool
    actual_refusal: bool
    correctness_score: float  # 0.0 to 1.0 heuristic score
    citation_valid: bool
    retrieval_hit: bool  # Expected file in top-k
    latency_ms: float
    actual_answer: str
    retrieved_files: List[str]
    failure_notes: Optional[str] = None


class EvaluationReport(BaseModel):
    """Aggregate report of benchmark evaluation."""
    timestamp: str
    total_questions: int
    answerable_count: int
    unanswerable_count: int
    retrieval_hit_rate: float
    citation_accuracy_rate: float
    refusal_accuracy_rate: float
    avg_latency_ms: float
    results: List[EvaluationResult]
    failure_cases: List[EvaluationResult]

"""Vector retriever using in-memory cosine similarity over local embeddings."""

from typing import List, Tuple, Optional
import numpy as np

from .models import DocumentChunk, RetrievedPassage
from .embedder import embed_text, embed_texts


import re

STOP_WORDS = {
    "how", "what", "when", "where", "which", "who", "whom", "this", "that",
    "with", "from", "have", "does", "the", "and", "for", "are", "can", "should", "your"
}


def compute_keyword_overlap(query: str, doc_text: str) -> float:
    """Computes stop-word filtered lexical token overlap between query and document."""
    raw_tokens = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", query.lower())
    q_tokens = [t for t in raw_tokens if t not in STOP_WORDS]
    if not q_tokens:
        q_tokens = raw_tokens
    if not q_tokens:
        return 0.0
    doc_lower = doc_text.lower()
    matches = sum(1 for t in q_tokens if t in doc_lower)
    return matches / len(q_tokens)


class VectorIndex:
    """In-memory vector store for a repository's document chunks."""

    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self.vectors: Optional[np.ndarray] = None
        self.repo_key: str = ""

    def clear(self):
        self.chunks = []
        self.vectors = None
        self.repo_key = ""

    def index_chunks(self, repo_key: str, chunks: List[DocumentChunk]):
        """Indexes a list of chunks by computing their embeddings."""
        if not chunks:
            self.clear()
            return

        self.repo_key = repo_key
        self.chunks = chunks

        # Prepare texts including heading context for better retrieval fidelity
        texts = [
            f"[{c.heading}] {c.content}" if c.heading else c.content
            for c in chunks
        ]
        self.vectors = embed_texts(texts)

    def retrieve(self, query: str, top_k: int = 3) -> List[RetrievedPassage]:
        """
        Retrieves the top-k most similar chunks for the query using hybrid scoring
        (dense cosine similarity + lexical keyword overlap).
        Returns a list of RetrievedPassage objects sorted by descending similarity.
        """
        if not self.chunks or self.vectors is None or len(self.chunks) == 0:
            return []

        query_vec = embed_text(query)
        dense_sims = np.dot(self.vectors, query_vec)

        # Compute hybrid scores combining dense semantic similarity and lexical keyword overlap
        combined_scores = np.zeros(len(self.chunks), dtype=np.float32)
        for i, chunk in enumerate(self.chunks):
            lex_score = compute_keyword_overlap(query, chunk.content)
            # 60% dense cosine similarity + 40% lexical overlap boost
            combined_scores[i] = (0.6 * float(dense_sims[i])) + (0.4 * lex_score)

        # Get top-k indices
        top_k = min(top_k, len(self.chunks))
        top_indices = np.argsort(combined_scores)[::-1][:top_k]

        passages: List[RetrievedPassage] = []
        for rank, idx in enumerate(top_indices, start=1):
            score = float(combined_scores[idx])
            passages.append(
                RetrievedPassage(
                    chunk=self.chunks[idx],
                    similarity_score=round(score, 4),
                    rank=rank
                )
            )

        return passages


# Global active index instance
active_index = VectorIndex()

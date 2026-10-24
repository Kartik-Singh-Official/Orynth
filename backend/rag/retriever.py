"""Vector retriever using in-memory cosine similarity over local embeddings."""

from typing import List, Tuple, Optional
import numpy as np

from .models import DocumentChunk, RetrievedPassage
from .embedder import embed_text, embed_texts


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
        Retrieves the top-k most similar chunks for the query using cosine similarity.
        Returns a list of RetrievedPassage objects sorted by descending similarity.
        """
        if not self.chunks or self.vectors is None or len(self.chunks) == 0:
            return []

        query_vec = embed_text(query)
        # Since vectors are unit-normalized, cosine similarity is simply the dot product
        similarities = np.dot(self.vectors, query_vec)

        # Get top-k indices
        top_k = min(top_k, len(self.chunks))
        top_indices = np.argsort(similarities)[::-1][:top_k]

        passages: List[RetrievedPassage] = []
        for rank, idx in enumerate(top_indices, start=1):
            score = float(similarities[idx])
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

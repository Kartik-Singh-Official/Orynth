"""LRU Answer Cache with TTL to eliminate redundant Gemini API calls and prevent token drain."""

import time
import hashlib
from collections import OrderedDict
from typing import Optional, List, Dict, Any

from .models import GroundedAnswer, RetrievedPassage


class AnswerCache:
    """
    In-memory LRU cache with TTL for grounded answers.
    Caches model responses keyed by normalized question and retrieved passage chunk IDs.
    """

    def __init__(self, max_size: int = 500, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        # Maps cache_key -> (GroundedAnswer, timestamp)
        self._cache: OrderedDict[str, tuple[GroundedAnswer, float]] = OrderedDict()
        self.hits: int = 0
        self.misses: int = 0

    def _make_key(self, question: str, passages: List[RetrievedPassage]) -> str:
        """Generates a deterministic hash key for question + retrieved chunks."""
        norm_q = " ".join(question.strip().lower().split())
        chunk_ids = ",".join(p.chunk.chunk_id for p in passages)
        raw = f"{norm_q}::{chunk_ids}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, question: str, passages: List[RetrievedPassage]) -> Optional[GroundedAnswer]:
        """
        Retrieves a cached answer if valid and unexpired.
        Returns None if cache miss or expired.
        """
        key = self._make_key(question, passages)
        if key not in self._cache:
            self.misses += 1
            return None

        cached_answer, created_at = self._cache[key]
        now = time.time()
        if now - created_at > self.ttl_seconds:
            # Expired
            del self._cache[key]
            self.misses += 1
            return None

        # Move to end (most recently used)
        self._cache.move_to_end(key)
        self.hits += 1

        # Return a copy marked with cached=True
        return GroundedAnswer(
            question=cached_answer.question,
            answer=cached_answer.answer,
            is_refusal=cached_answer.is_refusal,
            refusal_reason=cached_answer.refusal_reason,
            citations=cached_answer.citations,
            retrieved_passages=cached_answer.retrieved_passages,
            model_name=f"{cached_answer.model_name} (in-memory cached)",
            latency_ms=1.5,
            cached=True
        )

    def put(self, question: str, passages: List[RetrievedPassage], answer: GroundedAnswer) -> None:
        """Saves a grounded answer to the cache."""
        key = self._make_key(question, passages)
        now = time.time()

        if key in self._cache:
            self._cache.move_to_end(key)
        elif len(self._cache) >= self.max_size:
            # Evict least recently used (first item)
            self._cache.popitem(last=False)

        self._cache[key] = (answer, now)

    def stats(self) -> Dict[str, Any]:
        """Returns cache telemetry stats."""
        total_requests = self.hits + self.misses
        hit_ratio = round((self.hits / total_requests) * 100, 1) if total_requests > 0 else 0.0
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio_percent": hit_ratio,
            "ttl_seconds": self.ttl_seconds,
        }

    def clear(self) -> None:
        """Clears all cached entries."""
        self._cache.clear()
        self.hits = 0
        self.misses = 0


# Global answer cache singleton
global_answer_cache = AnswerCache(max_size=500, ttl_seconds=3600)

"""Tests for sliding window rate limiter and LRU answer caching."""

import pytest
import time
from backend.rag.rate_limiter import SlidingWindowRateLimiter
from backend.rag.answer_cache import AnswerCache
from backend.rag.models import GroundedAnswer, RetrievedPassage, DocumentChunk


def test_rate_limiter_burst_and_rpm():
    """Verifies that the rate limiter enforces both 10s burst limits and 60s RPM."""
    limiter = SlidingWindowRateLimiter(
        max_requests_per_minute=10,
        burst_limit_per_10s=3,
        window_seconds=60
    )
    ip = "192.168.1.50"

    # First 3 requests in quick succession should be allowed
    for i in range(3):
        allowed, retry_after, headers = limiter.check_rate_limit(ip)
        assert allowed is True
        assert retry_after == 0

    # 4th burst request in the same 10-second window should be rejected
    allowed, retry_after, headers = limiter.check_rate_limit(ip)
    assert allowed is False
    assert retry_after > 0
    assert headers["X-RateLimit-Remaining"] == "0"


def test_rate_limiter_status_and_reset():
    """Verifies status reporting and reset functionality."""
    limiter = SlidingWindowRateLimiter(max_requests_per_minute=5, burst_limit_per_10s=5)
    ip = "10.0.0.1"

    limiter.check_rate_limit(ip)
    limiter.check_rate_limit(ip)
    status = limiter.get_status(ip)
    assert status["used"] == 2
    assert status["remaining"] == 3

    limiter.reset(ip)
    status_after = limiter.get_status(ip)
    assert status_after["used"] == 0
    assert status_after["remaining"] == 5


def test_answer_cache_hit_and_miss():
    """Verifies LRU answer cache retrieval and hit count tracking."""
    cache = AnswerCache(max_size=3, ttl_seconds=60)
    chunk = DocumentChunk(
        chunk_id="chk_1",
        file_path="README.md",
        file_url="https://github.com/foo/bar/blob/main/README.md",
        heading="Install",
        start_line=1,
        end_line=10,
        content="pip install test",
        word_count=3
    )
    passages = [RetrievedPassage(chunk=chunk, similarity_score=0.9, rank=1)]
    question = "How to install?"

    # Initially a miss
    assert cache.get(question, passages) is None
    assert cache.misses == 1

    # Store answer
    ans = GroundedAnswer(
        question=question,
        answer="Run pip install test.",
        is_refusal=False,
        model_name="gemma-4-26b-a4b-it",
        latency_ms=1200.0,
        cached=False
    )
    cache.put(question, passages, ans)

    # Next get is a hit
    cached = cache.get(question, passages)
    assert cached is not None
    assert cached.cached is True
    assert cached.answer == "Run pip install test."
    assert cache.hits == 1

    # Same question with different case/spacing also hits
    cached2 = cache.get("  how to   install?  ", passages)
    assert cached2 is not None
    assert cache.hits == 2


def test_answer_cache_lru_eviction():
    """Verifies that cache evicts oldest entry when max_size is exceeded."""
    cache = AnswerCache(max_size=2, ttl_seconds=60)

    def make_passage(cid: str):
        c = DocumentChunk(
            chunk_id=cid,
            file_path="f.md",
            file_url="http://example.com",
            heading="",
            start_line=1,
            end_line=2,
            content="content",
            word_count=1
        )
        return [RetrievedPassage(chunk=c, similarity_score=0.8, rank=1)]

    p1, p2, p3 = make_passage("c1"), make_passage("c2"), make_passage("c3")

    cache.put("q1", p1, GroundedAnswer(question="q1", answer="a1", model_name="m"))
    cache.put("q2", p2, GroundedAnswer(question="q2", answer="a2", model_name="m"))
    cache.put("q3", p3, GroundedAnswer(question="q3", answer="a3", model_name="m"))

    # q1 should have been evicted (oldest)
    assert cache.get("q1", p1) is None
    # q2 and q3 should still be in cache
    assert cache.get("q2", p2) is not None
    assert cache.get("q3", p3) is not None

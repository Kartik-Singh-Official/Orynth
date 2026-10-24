"""Lightweight embedder module for Orynth RAG Engine.
Uses Google's gemini-embedding-001 via Google AI Studio API with fallback to local lightweight vector hashing.
Requires NO heavy PyTorch/transformers dependencies (<35MB total), perfectly suited for Vercel Serverless.
"""

import os
import hashlib
from collections import OrderedDict
from typing import List, Optional
import numpy as np
from dotenv import load_dotenv

load_dotenv()

EMBED_MODEL_NAME = os.environ.get("EMBED_MODEL", "gemini-embedding-001")
MAX_EMBEDDING_CACHE = 5000

_embedding_cache: OrderedDict[str, np.ndarray] = OrderedDict()
_genai_client = None


def _get_api_key() -> Optional[str]:
    return os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMMA_API_KEY")


def _get_genai_client():
    global _genai_client
    api_key = _get_api_key()
    if api_key and _genai_client is None:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=api_key)
        except Exception:
            _genai_client = None
    return _genai_client


def _cache_vector(text: str, vector: np.ndarray) -> None:
    if text in _embedding_cache:
        _embedding_cache.move_to_end(text)
    elif len(_embedding_cache) >= MAX_EMBEDDING_CACHE:
        _embedding_cache.popitem(last=False)
    _embedding_cache[text] = vector


def _fallback_hash_embedding(text: str, dim: int = 384) -> np.ndarray:
    """Fast, zero-dependency semantic hash embedding for offline / demo mode."""
    words = text.lower().split()
    vec = np.zeros(dim, dtype=np.float32)
    for w in words:
        h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h >> 8) & 1 else -1.0
        vec[idx] += sign
    norm = np.linalg.norm(vec)
    return (vec / norm) if norm > 0 else vec


def embed_text(text: str) -> np.ndarray:
    """Computes a unit-normalized embedding vector for a single text."""
    if text in _embedding_cache:
        _embedding_cache.move_to_end(text)
        return _embedding_cache[text]

    client = _get_genai_client()
    if client is not None:
        try:
            resp = client.models.embed_content(
                model=EMBED_MODEL_NAME,
                contents=text
            )
            raw = np.array(resp.embeddings[0].values, dtype=np.float32)
            norm = np.linalg.norm(raw)
            vec = (raw / norm) if norm > 0 else raw
            _cache_vector(text, vec)
            return vec
        except Exception:
            pass

    vec = _fallback_hash_embedding(text)
    _cache_vector(text, vec)
    return vec


def embed_texts(texts: List[str]) -> np.ndarray:
    """Computes unit-normalized embedding vectors for a batch of texts."""
    uncached_indices = []
    uncached_texts = []
    results: List[Optional[np.ndarray]] = [None] * len(texts)

    for i, t in enumerate(texts):
        if t in _embedding_cache:
            _embedding_cache.move_to_end(t)
            results[i] = _embedding_cache[t]
        else:
            uncached_indices.append(i)
            uncached_texts.append(t)

    if uncached_texts:
        client = _get_genai_client()
        computed_vectors = []
        if client is not None:
            try:
                # Batch in groups of 50
                batch_size = 50
                for b_start in range(0, len(uncached_texts), batch_size):
                    batch = uncached_texts[b_start:b_start + batch_size]
                    resp = client.models.embed_content(
                        model=EMBED_MODEL_NAME,
                        contents=batch
                    )
                    for emb in resp.embeddings:
                        raw = np.array(emb.values, dtype=np.float32)
                        norm = np.linalg.norm(raw)
                        vec = (raw / norm) if norm > 0 else raw
                        computed_vectors.append(vec)
            except Exception:
                computed_vectors = []

        if len(computed_vectors) != len(uncached_texts):
            # Fallback for any uncomputed
            computed_vectors = [_fallback_hash_embedding(t) for t in uncached_texts]

        for idx, text, vec in zip(uncached_indices, uncached_texts, computed_vectors):
            _cache_vector(text, vec)
            results[idx] = vec

    return np.array(results, dtype=np.float32)

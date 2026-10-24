from typing import List, Optional
from collections import OrderedDict
import numpy as np

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MAX_EMBEDDING_CACHE = 5000

_model = None
_embedding_cache: OrderedDict[str, np.ndarray] = OrderedDict()


def _cache_vector(text: str, vector: np.ndarray) -> None:
    """Stores vector in LRU cache, evicting oldest entry if over capacity."""
    if text in _embedding_cache:
        _embedding_cache.move_to_end(text)
    elif len(_embedding_cache) >= MAX_EMBEDDING_CACHE:
        _embedding_cache.popitem(last=False)
    _embedding_cache[text] = vector


def get_embedding_model():
    """Lazily loads the SentenceTransformer model on CPU."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(EMBED_MODEL_NAME, device="cpu")
        except Exception as e:
            raise RuntimeError(f"Failed to load embedding model '{EMBED_MODEL_NAME}': {e}")
    return _model


def embed_text(text: str) -> np.ndarray:
    """Computes a normalized embedding vector for a single text string."""
    if text in _embedding_cache:
        _embedding_cache.move_to_end(text)
        return _embedding_cache[text]

    model = get_embedding_model()
    # Normalize embeddings for fast cosine similarity via dot product
    vector = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    _cache_vector(text, vector)
    return vector


def embed_texts(texts: List[str]) -> np.ndarray:
    """Computes normalized embedding vectors for a batch of texts."""
    model = get_embedding_model()
    vectors = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    for text, vec in zip(texts, vectors):
        _cache_vector(text, vec)
    return vectors


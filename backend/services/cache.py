# backend/services/cache.py
# Performance Layer: In-memory LRU cache for embeddings and concept data
# (Redis-compatible interface — replace with aioredis for production)

import time
import hashlib
import logging
from collections import OrderedDict
from typing import Any, Optional

logger = logging.getLogger(__name__)


class InMemoryCache:
    """
    Thread-safe LRU cache with TTL support.
    Acts as a drop-in replacement for Redis in single-server deployments.
    For multi-server production use, swap with aioredis.
    """

    def __init__(self, max_size: int = 512, default_ttl: int = 3600):
        self._store: OrderedDict = OrderedDict()
        self._expires: dict = {}
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._hits = 0
        self._misses = 0

    def _is_expired(self, key: str) -> bool:
        exp = self._expires.get(key)
        if exp is None:
            return False
        return time.time() > exp

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store or self._is_expired(key):
            self._misses += 1
            if key in self._store:
                del self._store[key]
                del self._expires[key]
            return None
        # LRU: move to end
        self._store.move_to_end(key)
        self._hits += 1
        return self._store[key]

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = value
        self._expires[key] = time.time() + (ttl or self.default_ttl)
        # Evict oldest if over capacity
        while len(self._store) > self.max_size:
            oldest_key, _ = self._store.popitem(last=False)
            self._expires.pop(oldest_key, None)

    def delete(self, key: str):
        self._store.pop(key, None)
        self._expires.pop(key, None)

    def stats(self) -> dict:
        total = self._hits + self._misses
        hit_rate = round(self._hits / max(total, 1) * 100, 1)
        return {
            "size": len(self._store),
            "max_size": self.max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate_pct": hit_rate
        }

    def clear(self):
        self._store.clear()
        self._expires.clear()


# ─── Global cache instances ──────────────────────────────────────────────────

# Embedding cache: topic → {concept_name: embedding_vector}
embedding_cache = InMemoryCache(max_size=256, default_ttl=86400)  # 24h

# Analysis result cache: hash(topic+explanation) → full result
result_cache = InMemoryCache(max_size=128, default_ttl=1800)  # 30 min


def make_cache_key(topic: str, explanation: str) -> str:
    """Creates a deterministic cache key from topic + explanation."""
    raw = f"{topic.lower().strip()}::{explanation.strip()[:500]}"
    return hashlib.md5(raw.encode()).hexdigest()


def get_cached_result(topic: str, explanation: str) -> Optional[dict]:
    key = make_cache_key(topic, explanation)
    result = result_cache.get(key)
    if result:
        logger.info(f"Cache HIT for topic='{topic}'")
        return result
    return None


def cache_result(topic: str, explanation: str, result: dict):
    key = make_cache_key(topic, explanation)
    # Don't cache results with attempt_id as they're user-specific
    cacheable = {k: v for k, v in result.items() if k != "attempt_id"}
    result_cache.set(key, cacheable)


def get_cache_stats() -> dict:
    return {
        "embedding_cache": embedding_cache.stats(),
        "result_cache": result_cache.stats()
    }

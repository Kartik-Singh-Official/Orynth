"""Rate limiter for Gemini API inference endpoints to prevent token and quota exhaustion."""

import time
from collections import defaultdict, deque
from typing import Dict, Tuple, Optional, Any


class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter tracking request timestamps per client IP.
    Enforces requests-per-minute (RPM) and burst limits.
    """

    def __init__(
        self,
        max_requests_per_minute: int = 15,
        burst_limit_per_10s: int = 5,
        window_seconds: int = 60
    ):
        self.max_requests_per_minute = max_requests_per_minute
        self.burst_limit_per_10s = burst_limit_per_10s
        self.window_seconds = window_seconds
        # Mapping from client_ip -> deque of timestamps
        self._history: Dict[str, deque] = defaultdict(deque)

    def _clean_old_records(self, ip: str, now: float) -> None:
        """Removes timestamps outside the rolling 60s window."""
        dq = self._history[ip]
        cutoff = now - self.window_seconds
        while dq and dq[0] <= cutoff:
            dq.popleft()

    def check_rate_limit(self, client_ip: str) -> Tuple[bool, int, Dict[str, str]]:
        """
        Checks whether client_ip can perform a new API inference request.
        Returns:
            (allowed: bool, retry_after_seconds: int, headers: Dict[str, str])
        """
        now = time.time()
        self._clean_old_records(client_ip, now)
        dq = self._history[client_ip]

        # Check rolling 60s limit
        current_count = len(dq)
        if current_count >= self.max_requests_per_minute:
            oldest = dq[0]
            retry_after = max(1, int(oldest + self.window_seconds - now) + 1)
            headers = {
                "X-RateLimit-Limit": str(self.max_requests_per_minute),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(retry_after),
            }
            return False, retry_after, headers

        # Check 10s burst limit
        ten_sec_cutoff = now - 10
        burst_count = sum(1 for t in dq if t > ten_sec_cutoff)
        if burst_count >= self.burst_limit_per_10s:
            recent_timestamps = [t for t in dq if t > ten_sec_cutoff]
            retry_after = max(1, int(recent_timestamps[0] + 10 - now) + 1)
            headers = {
                "X-RateLimit-Limit": str(self.burst_limit_per_10s),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(retry_after),
            }
            return False, retry_after, headers

        # Allowed: register request timestamp
        dq.append(now)
        remaining = self.max_requests_per_minute - len(dq)
        headers = {
            "X-RateLimit-Limit": str(self.max_requests_per_minute),
            "X-RateLimit-Remaining": str(max(0, remaining)),
            "X-RateLimit-Reset": "0",
        }
        return True, 0, headers

    def get_status(self, client_ip: str) -> Dict[str, Any]:
        """Returns rate limit status for a client IP."""
        now = time.time()
        self._clean_old_records(client_ip, now)
        dq = self._history[client_ip]
        count = len(dq)
        remaining = max(0, self.max_requests_per_minute - count)
        reset_in = 0
        if dq:
            reset_in = max(0, int(dq[0] + self.window_seconds - now))

        return {
            "client_ip": client_ip,
            "limit_rpm": self.max_requests_per_minute,
            "used": count,
            "remaining": remaining,
            "reset_seconds": reset_in
        }

    def reset(self, client_ip: Optional[str] = None) -> None:
        """Resets history (for testing or administrative clear)."""
        if client_ip:
            self._history.pop(client_ip, None)
        else:
            self._history.clear()


# Global rate limiter instance
global_rate_limiter = SlidingWindowRateLimiter(
    max_requests_per_minute=15,
    burst_limit_per_10s=5,
    window_seconds=60
)

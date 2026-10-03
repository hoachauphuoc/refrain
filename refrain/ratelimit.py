"""Caps on AI use for the public link: AI requests per visitor per rolling hour, and Gemini calls
per UTC day (retries included). In memory on one instance, so they stop bursts, not slow abuse;
the budget alert and switching the service off are the backstops."""
import json
import logging
import os
import threading
import time
from collections import deque
from datetime import datetime, timezone

from flask import request

log = logging.getLogger("refrain.ratelimit")
HOUR = 3600


class RateLimited(Exception):
    """Over a cap. Roadmap and check answer 429; the debrief still returns its progression."""


def client_ip():
    """The visitor's address. Cloud Run appends the address it saw to X-Forwarded-For, so only the
    last entry can be trusted; earlier entries are whatever the client sent."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if os.environ.get("REFRAIN_LOG_FORWARDED") == "1":
        # Off by default: only to check, on a new deployment, which entry Cloud Run adds.
        log.info(json.dumps({"event": "forwarded_for", "value": forwarded}))
    last = forwarded.split(",")[-1].strip()
    return last or request.remote_addr or "unknown"


class Limits:
    def __init__(self, per_hour, daily_cap, clock=time.time):
        self.per_hour = per_hour
        self.daily_cap = daily_cap
        self._clock = clock
        self._lock = threading.Lock()
        self._requests = {}  # ip -> times of its AI requests in the last hour
        self._day = None
        self._calls = 0

    def admit(self, ip):
        """Count one AI request from this visitor, or raise RateLimited."""
        now = self._clock()
        with self._lock:
            if len(self._requests) > 1000:  # forget visitors who have been quiet for an hour
                self._requests = {k: v for k, v in self._requests.items() if v and now - v[-1] < HOUR}
            times = self._requests.setdefault(ip, deque())
            while times and now - times[0] >= HOUR:
                times.popleft()
            if len(times) >= self.per_hour or self._calls_today(now) >= self.daily_cap:
                raise RateLimited()
            times.append(now)

    def take_call(self):
        """Count one Gemini call against today's cap, or raise RateLimited."""
        now = self._clock()
        with self._lock:
            if self._calls_today(now) >= self.daily_cap:
                raise RateLimited()
            self._calls += 1

    def _calls_today(self, now):
        day = datetime.fromtimestamp(now, timezone.utc).date()
        if day != self._day:
            self._day, self._calls = day, 0
        return self._calls


class CappedGemini:
    """The Gemini client with every call, retries included, counted against the daily cap."""

    def __init__(self, gemini, limits):
        self._gemini = gemini
        self._limits = limits
        self.simulated = gemini.simulated

    def generate_json(self, job, system, user, schema):
        self._limits.take_call()
        return self._gemini.generate_json(job, system, user, schema)

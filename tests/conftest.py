import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from refrain import create_app  # noqa: E402


@pytest.fixture
def app(monkeypatch):
    monkeypatch.setenv("REFRAIN_FAKE_AI", "1")
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def fake(app):
    """The simulated coach. Queue answers or CoachErrors on `fake.queue`; `fake.calls` lists the jobs called."""
    return app.extensions["refrain.gemini"]

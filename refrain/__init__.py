"""Refrain's server: serves the page, holds the fixed rules, and is the only part that talks to Gemini."""
import logging
import mimetypes
import os
import sys
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from werkzeug.exceptions import RequestEntityTooLarge

from . import routes
from .gemini import FakeGemini, Gemini
from .ratelimit import Limits

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
}

# Some Windows registries map .js to text/plain, which browsers refuse for module scripts.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")


def _setup_logging():
    # One JSON line per event on stdout, which Cloud Run turns into structured logs.
    logger = logging.getLogger("refrain")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False


def create_app():
    _setup_logging()
    app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")
    app.config["MAX_CONTENT_LENGTH"] = 32 * 1024

    if os.environ.get("REFRAIN_FAKE_AI") == "1":
        gemini = FakeGemini()
    else:
        gemini = Gemini(
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "global"),
            model=os.environ.get("REFRAIN_MODEL", "gemini-3.8-flash"),
            thinking=os.environ.get("REFRAIN_THINKING", "medium"),
        )
    app.extensions["refrain.gemini"] = gemini
    app.extensions["refrain.limits"] = Limits(
        per_hour=int(os.environ.get("REFRAIN_RATE_PER_HOUR", "30")),
        daily_cap=int(os.environ.get("REFRAIN_DAILY_CAP", "360")),
    )

    @app.get("/")
    def index():
        return send_from_directory(STATIC_DIR, "index.html")

    app.register_blueprint(routes.bp)

    @app.errorhandler(RequestEntityTooLarge)
    def too_large(_error):
        return jsonify({"error": "invalid_input", "fields": {"body": "This request is too large."}}), 413

    @app.after_request
    def add_security_headers(response):
        response.headers.update(SECURITY_HEADERS)
        return response

    return app

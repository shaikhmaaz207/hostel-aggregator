# core/logger.py
# HA-39: Production Logging Configuration

import os
import logging
import logging.handlers
from pathlib import Path

# Create logs directory
LOGS_DIR = Path(__file__).parent.parent / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

def setup_logging():
    """
    Configure production logging to write to files.
    - app.log: All application logs
    - error.log: Only errors and critical
    - access.log: API access logs
    """

    # ── FORMATTERS ──
    detailed_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    simple_formatter = logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # ── HANDLERS ──

    # App log — all levels
    app_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / 'app.log',
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=5
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(detailed_formatter)

    # Error log — errors only
    error_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / 'error.log',
        maxBytes=5 * 1024 * 1024,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(simple_formatter)

    # ── ROOT LOGGER ──
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(app_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)

    logging.info("✅ Logging system initialized")
    logging.info(f"📁 Log directory: {LOGS_DIR}")
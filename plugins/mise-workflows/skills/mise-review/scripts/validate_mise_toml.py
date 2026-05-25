#!/usr/bin/env python3
"""Run the shared mise-workflows validator from the review skill."""

from __future__ import annotations

import runpy
from pathlib import Path


if __name__ == "__main__":
    script = Path(__file__).resolve().parents[3] / "scripts" / "validate_mise_toml.py"
    runpy.run_path(str(script), run_name="__main__")

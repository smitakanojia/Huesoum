"""satquery/render/ — P3 rendering layer (Master F5.5, FE-02).

Turns a JobResult into display layers (rendered PNGs + GeoJSON in EPSG:4326) and the
downloadable report, writing runs/<id>/outputs/. The browser never receives raw
GeoTIFFs — only PNGs (<= 4096 px on the longest side) and GeoJSON.

`styles.json` (next to this file) is the single source of layer styling; the web app
imports the same values (see web/src/core/engine.ts STYLES). Keep them in sync.

The full implementation depends on P2's tool outputs and satquery.common.geo helpers
(px_to_lonlat, image_corners_lonlat). This module is the scaffold with the interface
the server imports; wire the body when P2's run_job is available.
"""
from __future__ import annotations

import json
from pathlib import Path

STYLES = json.loads((Path(__file__).parent / "styles.json").read_text())


def build_outputs(result: dict, workdir: Path, base_url: str) -> dict:
    """Fill result.layers and result.downloads, and write runs/<id>/outputs/.

    base_url = f"/api/jobs/{job_id}/files/". Returns the enriched JobResult, which
    the server saves to outputs/result.json.

    Layer order: base -> fills -> outlines -> boxes. Style lookup is the longest key
    in styles.json that is a prefix of the layer id.
    """
    # Scaffold: real rendering is wired when P2 tool outputs are available.
    result.setdefault("layers", [])
    result.setdefault("downloads", {})
    return result

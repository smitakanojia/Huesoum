"""SatQuery API server (P3 scope, Master F3.6).

This is the FastAPI surface the web app talks to in LIVE mode. It wires the HTTP
endpoints to satquery.agent.job.run_job and satquery.render.build_outputs. Per the
handover, the server imports ONLY run_job, satquery.render and satquery.contracts;
it never calls tools directly.

Until P2's run_job and satquery/render are wired in this checkout, the endpoints
run against a small stub so the contract shape and the upload → poll → result cycle
can be exercised (see tests/p3/test_server.py). The web app defaults to demonstration
mode and does not require this server; it is here so the structure matches the PDF
and so the frontend can be pointed at a real core with VITE_API_BASE.
"""
from __future__ import annotations

import json
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .schemas import Example, Health, JobCreated, JobStatus

RUNS = Path(os.environ.get("SATQUERY_RUNS", "runs")).resolve()
RUNS.mkdir(parents=True, exist_ok=True)
ALLOWED_EXT = {".tif", ".tiff", ".png", ".jpg", ".jpeg"}  # server allow-list (FE-01)
MAX_BYTES = 2 * 1024 * 1024 * 1024
CONTRACT_VERSION = "1.0"

app = FastAPI(title="SatQuery API", version=CONTRACT_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS: dict[str, dict] = {}
_pool = ThreadPoolExecutor(max_workers=1)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _run_job_stub(question: str, files, workdir: Path, input_mode: str, on_step):
    """Placeholder for satquery.agent.job.run_job (provided by P2).

    Replace this import with the real one when the core is available:
        from satquery.agent.job import run_job
    """
    on_step({"step_id": "s1", "tool": "controller", "model_id": "stub",
             "status": "ok", "summary": "stub run: connect P2 run_job for real analysis",
             "runtime_s": 0.0, "source": "fake"})
    return {
        "job_id": workdir.name,
        "status": "needs_input",
        "message": "This is the API stub. Wire satquery.agent.job.run_job (P2) and "
                   "satquery.render (P3) to produce real results. The web app runs "
                   "its own demonstration core in the meantime.",
        "fusion": None,
        "trace": None,
        "layers": [],
        "downloads": {},
    }


@app.get("/api/health", response_model=Health)
def health() -> Health:
    return Health(contract_version=CONTRACT_VERSION, run_mode="fake", git="p3-scaffold")


@app.get("/api/examples", response_model=list[Example])
def examples() -> list[Example]:
    path = Path(__file__).resolve().parent.parent / "demo" / "scenes" / "scene.json"
    if path.exists():
        data = json.loads(path.read_text())
        return [Example(**e) for e in data.get("examples", [])]
    return []


def _safe_child(root: Path, rel: str) -> Path:
    target = (root / rel).resolve()
    if root not in target.parents and target != root:
        raise HTTPException(status_code=400, detail="path traversal rejected")
    return target


@app.post("/api/jobs", response_model=JobCreated)
async def create_job(
    files: list[UploadFile] = File(default=[]),
    question: str = Form(...),
    input_mode: str = Form("geotiff"),
    session_id: str | None = Form(default=None),
) -> JobCreated:
    job_id = uuid.uuid4().hex[:12]
    workdir = RUNS / job_id
    (workdir / "inputs").mkdir(parents=True, exist_ok=True)
    saved = []
    for up in files:
        ext = os.path.splitext(up.filename or "")[1].lower()
        if ext not in ALLOWED_EXT:
            raise HTTPException(status_code=400, detail=f"bad extension: {ext}")
        dest = workdir / "inputs" / os.path.basename(up.filename or "input")
        size = 0
        with dest.open("wb") as fh:
            while chunk := await up.read(1 << 20):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise HTTPException(status_code=413, detail="file too large")
                fh.write(chunk)
        saved.append(dest)
    (workdir / "request.json").write_text(json.dumps({"question": question, "input_mode": input_mode, "session_id": session_id}))
    JOBS[job_id] = {"job_id": job_id, "status": "queued", "steps_done": [], "current": None, "created_at": _now(), "finished_at": None}
    _pool.submit(_worker, job_id, question, saved, workdir, input_mode)
    return JobCreated(job_id=job_id)


def _worker(job_id: str, question: str, files, workdir: Path, input_mode: str) -> None:
    rec = JOBS[job_id]
    rec["status"] = "running"

    def on_step(step: dict) -> None:
        rec["steps_done"].append(step)
        rec["current"] = step.get("step_id")

    try:
        result = _run_job_stub(question, files, workdir, input_mode, on_step)
        # When satquery.render is available:
        #   from satquery import render
        #   result = render.build_outputs(result, workdir, f"/api/jobs/{job_id}/files/")
        (workdir / "outputs").mkdir(exist_ok=True)
        (workdir / "outputs" / "result.json").write_text(json.dumps(result))
        rec["status"] = result.get("status", "done")
    except Exception as exc:  # noqa: BLE001
        rec["status"] = "failed"
        rec["message"] = str(exc)
    finally:
        rec["finished_at"] = _now()


@app.post("/api/jobs/from-example/{example_id}", response_model=JobCreated)
def from_example(example_id: str) -> JobCreated:
    job_id = uuid.uuid4().hex[:12]
    workdir = RUNS / job_id
    (workdir / "outputs").mkdir(parents=True, exist_ok=True)
    JOBS[job_id] = {"job_id": job_id, "status": "queued", "steps_done": [], "current": None, "created_at": _now(), "finished_at": None}
    ex = next((e for e in examples() if e.example_id == example_id), None)
    q = ex.question if ex else ""
    _pool.submit(_worker, job_id, q, [], workdir, "geotiff")
    return JobCreated(job_id=job_id)


@app.get("/api/jobs/{job_id}", response_model=JobStatus)
def job_status(job_id: str) -> JobStatus:
    rec = JOBS.get(job_id)
    if not rec:
        # fall back to disk after a restart
        result = RUNS / job_id / "outputs" / "result.json"
        if result.exists():
            return JobStatus(job_id=job_id, status="done", created_at=_now())
        raise HTTPException(status_code=404, detail="unknown job")
    return JobStatus(**rec)


@app.get("/api/jobs/{job_id}/result")
def job_result(job_id: str) -> JSONResponse:
    path = RUNS / job_id / "outputs" / "result.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="no result yet")
    return JSONResponse(json.loads(path.read_text()))


@app.get("/api/jobs/{job_id}/files/{path:path}")
def job_file(job_id: str, path: str) -> FileResponse:
    root = (RUNS / job_id).resolve()
    target = _safe_child(root, path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="not found")
    return FileResponse(target)

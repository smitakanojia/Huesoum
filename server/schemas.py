"""Server-only response schemas (P3 owns these; the web app's TypeScript types are
generated from the running server's OpenAPI document, never hand-written).

These mirror Master Document F3.6. The shared contracts (JobResult, FusionResult,
Trace, Layer) live in satquery/contracts/ and MUST NOT be redefined here.
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class JobCreated(BaseModel):
    job_id: str


class TraceStepLite(BaseModel):
    step_id: str
    tool: str
    model_id: str
    status: str
    summary: str = ""
    runtime_s: float = 0.0
    source: str = "fake"


class JobStatus(BaseModel):
    job_id: str
    status: Literal["queued", "running", "done", "failed", "needs_input"]
    steps_done: list[TraceStepLite] = Field(default_factory=list)
    current: Optional[str] = None
    created_at: str
    finished_at: Optional[str] = None


class Example(BaseModel):
    example_id: str
    title: str
    story: Literal["A", "B", "C", "D"]
    question: str
    description: str
    input_mode: str = "geotiff"
    kind: Optional[str] = None
    domain: Optional[str] = None


class Health(BaseModel):
    contract_version: str
    run_mode: str
    git: str

"""P3 server tests (FE-01): the upload -> poll -> result cycle, path-traversal
rejection, and bad-extension rejection. Uses FastAPI's TestClient in fake mode.

Run:
    pip install -r server/requirements.txt httpx pytest
    pytest tests/p3
"""
import io
import time

import pytest

pytest.importorskip("fastapi")
from fastapi.testclient import TestClient  # noqa: E402

from server.app import app  # noqa: E402

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["contract_version"] == "1.0"
    assert "run_mode" in body


def test_examples():
    r = client.get("/api/examples")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_upload_poll_result_cycle():
    files = {"files": ("pair_T2.tif", io.BytesIO(b"\x00\x01\x02"), "image/tiff")}
    data = {"question": "What changed?", "input_mode": "geotiff"}
    r = client.post("/api/jobs", files=files, data=data)
    assert r.status_code == 200
    job_id = r.json()["job_id"]

    for _ in range(50):
        st = client.get(f"/api/jobs/{job_id}").json()
        if st["status"] in ("done", "failed", "needs_input"):
            break
        time.sleep(0.05)
    else:
        raise AssertionError("job did not finish")

    res = client.get(f"/api/jobs/{job_id}/result")
    assert res.status_code == 200
    assert "status" in res.json()


def test_bad_extension_rejected():
    files = {"files": ("notes.txt", io.BytesIO(b"hello"), "text/plain")}
    data = {"question": "x", "input_mode": "geotiff"}
    r = client.post("/api/jobs", files=files, data=data)
    assert r.status_code == 400


def test_path_traversal_rejected():
    # first make a job so the runs/<id> root exists
    files = {"files": ("a.tif", io.BytesIO(b"\x00"), "image/tiff")}
    r = client.post("/api/jobs", files=files, data={"question": "q", "input_mode": "geotiff"})
    job_id = r.json()["job_id"]
    r2 = client.get(f"/api/jobs/{job_id}/files/../../etc/passwd")
    assert r2.status_code in (400, 404)

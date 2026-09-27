# server/ — SatQuery API (P3 scope)

FastAPI surface the web app uses in **live** mode (Master F3.6). It wires the HTTP
endpoints to `satquery.agent.job.run_job` (P2) and `satquery.render` (P3). Until
those are wired in this checkout, the endpoints run against a small stub so the
contract shape and the upload → poll → result cycle can be exercised.

## Run

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Then point the web app at it:

```bash
cd ../web
echo "VITE_API_BASE=http://localhost:8000" > .env
npm run dev
```

## Endpoints (F3.6)

- `GET  /api/health` → `{contract_version, run_mode, git}`
- `GET  /api/examples`
- `POST /api/jobs` (multipart: `files`, `question`, `input_mode`, optional `session_id`)
- `POST /api/jobs/from-example/{id}`
- `GET  /api/jobs/{id}` → `JobStatus`
- `GET  /api/jobs/{id}/result` → `JobResult`
- `GET  /api/jobs/{id}/files/{path}` (path-traversal safe)

`session_id` on `POST /api/jobs` supports **multi-turn follow-up** (continue-the-same-chat):
the server keeps the turn list per session and the parser fills gaps from the previous
turn's `parsed_query` (Trace gains `resolved_from_turn`). See the gap-closure notes in
the repo root (`SatQuery-EarthDial-Gap-Closure-Changes` reference).

## Ownership

Owns `server/`. Never edits `satquery/contracts/`, `satquery/common/`, P1/P2 folders,
`tests/contract/`, `tests/e2e/`, or `pyproject.toml`. Types in `web/src/api/types.ts`
are generated from this server's OpenAPI document (`npm run gen:api`).

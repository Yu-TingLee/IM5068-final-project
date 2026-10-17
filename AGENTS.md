# AGENTS.md

## Project

- `client/`: React + Vite + Tailwind, JavaScript only. Hash routes (`#/claim`) because it is served from GitHub Pages.
- `server/`: FastAPI + SQLAlchemy + SQLite, managed with uv. Business rules live in `server/app/rules.py`.
- Code, comments and API error codes are English; Customer-facing text is zh-TW, inline in JSX. The server returns error codes and `client/src/errors.js` maps them to messages.
- Use the terms in `GLOSSARY.md` for names.
- Comment sparingly. Checks: `uv run pytest`, `uv run ruff check .` in `server/`; `npm run lint`, `npm run build` in `client/`.

## Agent skills

### Issue tracker

Local markdown under `.scratch/`; no remote tracker. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

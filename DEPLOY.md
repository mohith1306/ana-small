# Deploying Ana Small to Render

Two services ship together (no database to host):

| Piece    | What it is                  | Where it runs on Render          |
| -------- | --------------------------- | -------------------------------- |
| Frontend | Vite/React static build     | Static Site (`ana-small-frontend`) |
| Backend  | Flask API (SQL + OpenAI)    | Web Service (`ana-small-backend`)  |

Everything is wired by [`render.yaml`](render.yaml) at the repo root.

**No database is deployed.** Each user picks an engine (MySQL / Postgres / Snowflake /
BigQuery / Databricks / ClickHouse) and enters their own credentials in the app's
connector form. The backend runs every query against whatever credentials arrive with
the request, so there are **no DB env vars to set**.

---

## 1. Push the code to GitHub

Render deploys from a Git repo. From the repo root
(`c:\Users\mohit\Downloads\ana-small-main`):

```bash
git init
git add .
git commit -m "Deploy Ana Small (frontend + backend) to Render"
git branch -M main
git remote add origin https://github.com/<you>/ana-small.git
git push -u origin main
```

The [`.gitignore`](.gitignore) already keeps `node_modules/`, `dist/`, the 60 MB
`.xlsx`, and all `.env` secrets out of the commit.

## 2. Create the Blueprint on Render

1. Go to <https://dashboard.render.com> → **New** → **Blueprint**.
2. Connect the GitHub repo. Render detects [`render.yaml`](render.yaml) and shows
   two services: `ana-small-backend` and `ana-small-frontend`.
3. Click **Apply**. The backend needs no env vars; the only one to set is the
   frontend's `VITE_BACKEND_API_URL` (next step).

## 3. Point the frontend at the backend

After the backend's first deploy, copy its URL
(e.g. `https://ana-small-backend.onrender.com`), then on
**ana-small-frontend** → Environment set:

```
VITE_BACKEND_API_URL = https://ana-small-backend.onrender.com
```

Trigger a redeploy of the frontend so the value is baked into the build.

## 4. Verify

- Backend health: open `https://ana-small-backend.onrender.com/health` → `{"ok": true}`
- Connectors workbench: `https://ana-small-backend.onrender.com/` → loads `connectors.html`
- App: open the frontend URL, add a connector (engine + credentials), enter your OpenAI
  key, ask a question, and confirm a SQL query runs against your database.

---

## Notes

- **Free plan cold starts:** Render free web services sleep after ~15 min idle; the
  first request after sleep takes ~30–50 s. Upgrade the backend to a paid instance to
  avoid this.
- **OpenAI key:** each user enters their own key in the app's API key field; it's sent
  to the backend per request and never stored server-side (see `/api/chat` in
  [`local-backend/server.py`](local-backend/server.py)).
- **DB drivers:** [`local-backend/requirements.txt`](local-backend/requirements.txt)
  installs every engine's driver (MySQL, Postgres, Snowflake, BigQuery, Databricks,
  ClickHouse) so users can pick any connector. Keep them all; trim only the engines you
  never want to offer.

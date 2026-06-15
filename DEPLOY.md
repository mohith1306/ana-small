# Deploying Ana Small to Render

Three pieces ship together:

| Piece    | What it is                  | Where it runs on Render          |
| -------- | --------------------------- | -------------------------------- |
| Frontend | Vite/React static build     | Static Site (`ana-small-frontend`) |
| Backend  | Flask API (SQL + OpenAI)    | Web Service (`ana-small-backend`)  |
| Database | Your MySQL (`anasmall`)     | **Your own host** (not on Render) |

Everything is wired by [`render.yaml`](render.yaml) at the repo root.

---

## 0. Prerequisite: a reachable MySQL

Render runs in the cloud, so it **cannot** reach `localhost:3306` on your laptop.
The MySQL holding the 340B data must be reachable from the internet. Options:

- **Managed MySQL** (recommended): AWS RDS, Aiven, PlanetScale, etc. Load the data
  with the existing [`excel-to-mysql/import_excel.py`](excel-to-mysql/import_excel.py)
  pointed at the managed host.
- **Tunnel your local MySQL** (quick demo only): run a tunnel and use the public host
  it gives you:
  ```bash
  cloudflared tunnel --url tcp://localhost:3306
  ```
  Keep your laptop + tunnel running the whole time the app is up.

Have these 5 values ready: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`,
`MYSQL_PASSWORD`, `MYSQL_DATABASE`. (The OpenAI key is **not** a server setting —
each user enters their own in the app.)

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
3. Click **Apply**. It will prompt for the env vars marked `sync: false`.

## 3. Set the backend env vars

On **ana-small-backend** → Environment:

| Key              | Value                                  |
| ---------------- | -------------------------------------- |
| `MYSQL_HOST`     | the reachable host from step 0         |
| `MYSQL_PORT`     | `3306` (default already set)           |
| `MYSQL_USER`     | your DB user                           |
| `MYSQL_PASSWORD` | your DB password                       |
| `MYSQL_DATABASE` | `anasmall`                             |

The OpenAI key is **not** set here — users type their own key in the app's API key
field, which the frontend sends to the backend per request.

## 4. Point the frontend at the backend

After the backend's first deploy, copy its URL
(e.g. `https://ana-small-backend.onrender.com`), then on
**ana-small-frontend** → Environment set:

```
VITE_BACKEND_API_URL = https://ana-small-backend.onrender.com
```

Trigger a redeploy of the frontend so the value is baked into the build.

## 5. Verify

- Backend health: open `https://ana-small-backend.onrender.com/health` → `{"ok": true}`
- Connectors workbench: `https://ana-small-backend.onrender.com/` → loads `connectors.html`
- App: open the frontend URL, ask a question, confirm a SQL query runs against MySQL.

---

## Notes

- **Free plan cold starts:** Render free web services sleep after ~15 min idle; the
  first request after sleep takes ~30–50 s. Upgrade the backend to a paid instance to
  avoid this.
- **OpenAI key:** each user enters their own key in the app's API key field; it's sent
  to the backend per request and never stored server-side (see `/api/chat` in
  [`local-backend/server.py`](local-backend/server.py)).
- **Slimmer backend builds:** [`local-backend/requirements.txt`](local-backend/requirements.txt)
  installs every DB driver (Snowflake, BigQuery, Databricks, ClickHouse…). If you only
  use MySQL, delete the unused ones to make builds much faster.

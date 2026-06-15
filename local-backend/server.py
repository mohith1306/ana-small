"""
Local backend for the Ana Small chat app, talking to a LOCAL MySQL database
instead of the remote Cloudflare worker (which only speaks Redshift/Postgres).

It implements the two endpoints the frontend calls:
  POST /api/query  -> run SQL against MySQL, return {columns, rows, error?, query}
  POST /api/chat   -> proxy to OpenAI chat completions (the text-to-SQL brain)

Run:  python server.py   (listens on http://localhost:8787)
Point the frontend at it with ana-small-main/.env.local:
  VITE_BACKEND_API_URL=http://localhost:8787
"""

import datetime
import decimal
import os
import sys

import pymysql
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
HERE = os.path.dirname(os.path.abspath(__file__))

# Load MySQL defaults (MYSQL_HOST/PORT/USER/PASSWORD/DATABASE) from a .env file so
# CSV uploads can reuse your existing local credentials without re-typing them.
# Checks local-backend/.env first, then the sibling excel-to-mysql/.env.
try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(HERE, ".env"))
    load_dotenv(os.path.join(HERE, "..", "excel-to-mysql", ".env"))
except Exception:
    pass


try:
    # Let the terminal show UTF-8 (emojis) instead of crashing on Windows cp1252.
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def log(*parts):
    """Timestamped console logging so you can watch the request flow in the terminal.

    Never raises on consoles that can't encode emojis — falls back to ASCII.
    """
    import datetime

    ts = datetime.datetime.now().strftime("%H:%M:%S")
    msg = f"[{ts}] " + " ".join(str(p) for p in parts)
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        print(msg.encode("ascii", "replace").decode("ascii"), flush=True)
CORS(app)  # allow the Vite dev server (localhost:5173) to call us

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
# Optional: override the model the frontend hardcodes (o3-mini). Leave unset to passthrough.
OPENAI_MODEL_OVERRIDE = os.getenv("OPENAI_MODEL_OVERRIDE")


def _json_safe(value):
    """Convert MySQL types that aren't JSON serializable into strings."""
    if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
        return value.isoformat(sep=" ")
    if isinstance(value, datetime.timedelta):
        return str(value)
    if isinstance(value, decimal.Decimal):
        # keep ints as ints, others as float
        return int(value) if value == value.to_integral_value() else float(value)
    if isinstance(value, (bytes, bytearray)):
        try:
            return value.decode("utf-8", errors="replace")
        except Exception:
            return str(value)
    return value


def _rows_from_cursor(cur):
    """Build (columns, rows) from a DB-API cursor that just executed a query."""
    if cur.description:
        columns = [d[0] for d in cur.description]
        rows = [
            {col: _json_safe(val) for col, val in zip(columns, row)}
            for row in cur.fetchall()
        ]
        return columns, rows
    # non-SELECT (INSERT/UPDATE/DDL)
    affected = cur.rowcount if cur.rowcount is not None and cur.rowcount >= 0 else 0
    return ["affected_rows"], [{"affected_rows": affected}]


def _run_mysql(code, creds):
    conn = pymysql.connect(
        host=creds.get("host"),
        port=int(creds.get("port") or 3306),
        user=creds.get("user"),
        password=creds.get("password") or "",
        database=creds.get("database"),
        connect_timeout=10,
        read_timeout=120,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(code)
            columns, rows = _rows_from_cursor(cur)
            conn.commit()
        return columns, rows
    finally:
        conn.close()


def _run_postgres(code, creds):
    import psycopg2  # lazy import

    conn = psycopg2.connect(
        host=creds.get("host"),
        port=int(creds.get("port") or 5432),
        user=creds.get("user"),
        password=creds.get("password") or "",
        dbname=creds.get("database"),
        connect_timeout=10,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(code)
            columns, rows = _rows_from_cursor(cur)
            conn.commit()
        return columns, rows
    finally:
        conn.close()


def _run_databricks(code, creds):
    from databricks import sql as dbsql  # lazy import

    conn = dbsql.connect(
        server_hostname=creds.get("host"),
        http_path=creds.get("httpPath"),
        access_token=creds.get("password"),  # token entered in the password field
        catalog=creds.get("database") or None,  # "Catalog" field
        schema=creds.get("schema") or None,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(code)
            columns, rows = _rows_from_cursor(cur)
        return columns, rows
    finally:
        conn.close()


def _run_snowflake(code, creds):
    import snowflake.connector as sf  # lazy import

    conn = sf.connect(
        account=creds.get("host"),  # account identifier entered in the host field
        user=creds.get("user"),
        password=creds.get("password"),
        warehouse=creds.get("warehouse") or None,
        database=creds.get("database") or None,
        schema=creds.get("schema") or None,
        role=creds.get("role") or None,
        login_timeout=15,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(code)
            columns, rows = _rows_from_cursor(cur)
        return columns, rows
    finally:
        conn.close()


def _run_clickhouse(code, creds):
    import clickhouse_connect  # lazy import

    port = int(creds.get("port") or 8123)
    client = clickhouse_connect.get_client(
        host=creds.get("host"),
        port=port,
        username=creds.get("user") or "default",
        password=creds.get("password") or "",
        database=creds.get("database") or "default",
        secure=port in (443, 8443),  # ClickHouse Cloud uses TLS on 8443
        connect_timeout=10,
    )
    # clickhouse-connect appends "FORMAT Native"; a trailing ';' would make it a multi-statement.
    result = client.query(code.strip().rstrip(";"))
    columns = list(result.column_names)
    rows = [
        {col: _json_safe(val) for col, val in zip(columns, row)}
        for row in result.result_rows
    ]
    return columns, rows


def _run_bigquery(code, creds):
    import json

    from google.cloud import bigquery  # lazy import

    project = creds.get("host") or None  # Project ID entered in the host field
    key_json = (creds.get("password") or "").strip()  # service-account JSON, optional

    if key_json.startswith("{"):
        from google.oauth2 import service_account

        info = json.loads(key_json)
        gcreds = service_account.Credentials.from_service_account_info(info)
        client = bigquery.Client(project=project or info.get("project_id"), credentials=gcreds)
    else:
        # Fall back to Application Default Credentials (gcloud auth / GOOGLE_APPLICATION_CREDENTIALS)
        client = bigquery.Client(project=project)

    result = client.query(code).result()
    columns = [f.name for f in result.schema]
    rows = [{col: _json_safe(row[col]) for col in columns} for row in result]
    return columns, rows


ENGINES = {
    "mysql": _run_mysql,
    "postgres": _run_postgres,
    "databricks": _run_databricks,
    "snowflake": _run_snowflake,
    "clickhouse": _run_clickhouse,
    "bigquery": _run_bigquery,
}


@app.post("/api/query")
def api_query():
    body = request.get_json(force=True) or {}
    code = body.get("code") or ""
    creds = body.get("redshiftCredentials") or {}
    engine = (creds.get("engine") or "mysql").lower()

    if not code.strip():
        return jsonify({"columns": [], "rows": [], "error": "No SQL provided", "query": code})

    runner = ENGINES.get(engine)
    if runner is None:
        return jsonify({"columns": [], "rows": [], "error": f"Unsupported engine: {engine}", "query": code})

    # For local MySQL, fall back to the MYSQL_* env vars (.env) for any field the
    # connector form leaves blank — same defaults the CSV-upload endpoint uses.
    if engine == "mysql":
        creds = {
            "engine": "mysql",
            "host": creds.get("host") or os.getenv("MYSQL_HOST"),
            "port": creds.get("port") or os.getenv("MYSQL_PORT"),
            "user": creds.get("user") or os.getenv("MYSQL_USER"),
            "password": creds.get("password") or os.getenv("MYSQL_PASSWORD") or "",
            "database": creds.get("database") or os.getenv("MYSQL_DATABASE"),
        }

    # Minimal per-engine required fields so we give a clear error instead of a driver crash.
    required = {
        "mysql": ("host", "database", "user"),
        "postgres": ("host", "database", "user"),
        "databricks": ("host", "httpPath", "password"),
        "snowflake": ("host", "user", "password"),
        "clickhouse": ("host",),
        "bigquery": ("host",),  # project id; auth via service-account JSON or ADC
    }[engine]
    missing = [k for k in required if not creds.get(k)]
    if missing:
        log(f"🗄️  /api/query  ❌ missing {engine} fields: {', '.join(missing)}")
        return jsonify({
            "columns": [], "rows": [],
            "error": f"Missing {engine} connection details: {', '.join(missing)}. Fill them in the connector form.",
            "query": code,
        })

    target = creds.get("schema") or creds.get("database") or creds.get("host")
    log(f"🗄️  /api/query  engine={engine}  target={target}")
    log(f"     SQL ▶ {' '.join(code.split())[:300]}")
    try:
        columns, rows = runner(code, creds)
        log(f"     ✅ executed on database → {len(rows)} row(s), {len(columns)} column(s)")
        return jsonify({"columns": columns, "rows": rows, "query": code})
    except Exception as exc:  # noqa: BLE001 - surface DB errors to the model
        log(f"     ❌ database error: {exc}")
        return jsonify({"columns": [], "rows": [], "error": str(exc), "query": code})


@app.post("/api/chat")
def api_chat():
    body = request.get_json(force=True) or {}
    api_key = body.get("openaiApiKey")
    if not api_key:
        log("🤖 /api/chat  ❌ missing OpenAI API key")
        return ("Missing OpenAI API key. Enter it in the app's API key field.", 400)

    payload = {
        "model": OPENAI_MODEL_OVERRIDE or body.get("model") or "o3-mini",
        "messages": body.get("messages", []),
    }
    # Only include tools/tool_choice when tools are actually provided — OpenAI rejects
    # tool_choice without tools (the schema-only connectors flow sends no tools).
    tools = body.get("tools")
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = body.get("tool_choice", "auto")

    log(f"🤖 /api/chat  forwarding {len(payload['messages'])} message(s) to Ana Small "
        f"(model={payload['model']}, tools={'yes' if tools else 'no'})")
    try:    
        resp = requests.post(
            OPENAI_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=300,
        )
        log(f"     ↩️  Ana Small (OpenAI) responded HTTP {resp.status_code}")
        return (resp.text, resp.status_code, {"Content-Type": "application/json"})
    except Exception as exc:  # noqa: BLE001
        log(f"     ❌ failed to reach OpenAI: {exc}")
        return (f"Failed to reach OpenAI: {exc}", 502)


def _clean_identifier(raw, fallback="col"):
    """Turn an arbitrary string into a safe SQL identifier (table/column name)."""
    import re

    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", str(raw).strip()).strip("_").lower()
    return cleaned or fallback


@app.post("/api/upload-csv")
def api_upload_csv():
    """Ingest an uploaded CSV file into a MySQL table so it becomes a normal
    connector. Mirrors excel-to-mysql/import_excel.py: read with pandas, clean
    column names, then df.to_sql(..., if_exists='replace').

    Multipart form fields:
      file      -> the .csv file (required)
      table     -> destination table name (required)
      host, port, user, password, database -> MySQL target (required: host, user, database)
    """
    try:
        import io
        import pandas as pd
        from sqlalchemy import create_engine
        from sqlalchemy.engine import URL
    except ImportError as exc:
        return jsonify({
            "ok": False,
            "error": f"Server is missing a dependency ({exc.name}). Run: pip install pandas sqlalchemy openpyxl",
        }), 500

    f = request.files.get("file")
    if f is None or not f.filename:
        return jsonify({"ok": False, "error": "No CSV file was uploaded."}), 400

    form = request.form
    # Fall back to MYSQL_* env vars (.env) for any field the form leaves blank.
    host = (form.get("host") or os.getenv("MYSQL_HOST") or "").strip()
    user = (form.get("user") or os.getenv("MYSQL_USER") or "").strip()
    database = (form.get("database") or os.getenv("MYSQL_DATABASE") or "").strip()
    password = form.get("password")
    if not password:  # blank or missing -> use env default
        password = os.getenv("MYSQL_PASSWORD") or ""
    port = int(form.get("port") or os.getenv("MYSQL_PORT") or 3306)
    table = _clean_identifier(form.get("table") or f.filename.rsplit(".", 1)[0], "uploaded_csv")

    missing = [k for k, v in (("host", host), ("user", user), ("database", database)) if not v]
    if missing:
        return jsonify({"ok": False, "error": f"Missing MySQL details: {', '.join(missing)}."}), 400

    log(f"📤 /api/upload-csv  file={f.filename}  → mysql {user}@{host}:{port}/{database} table={table}")

    # Read the CSV with pandas (tolerate odd encodings).
    try:
        raw = f.read()
        try:
            df = pd.read_csv(io.BytesIO(raw))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(raw), encoding="latin-1")
    except Exception as exc:  # noqa: BLE001
        log(f"     ❌ could not parse CSV: {exc}")
        return jsonify({"ok": False, "error": f"Could not parse CSV: {exc}"}), 400

    # Clean column names and drop fully empty rows/columns (same as the Excel importer).
    seen = {}
    cleaned_cols = []
    for col in df.columns:
        name = _clean_identifier(col, "unknown_column")
        # de-duplicate collisions after cleaning
        if name in seen:
            seen[name] += 1
            name = f"{name}_{seen[name]}"
        else:
            seen[name] = 0
        cleaned_cols.append(name)
    df.columns = cleaned_cols
    df = df.dropna(how="all").dropna(axis=1, how="all")

    # Write into MySQL, replacing any existing table of the same name.
    try:
        connection_url = URL.create(
            "mysql+pymysql",
            username=user,
            password=password,
            host=host,
            port=port,
            database=database,
        )
        engine = create_engine(connection_url)
        df.to_sql(name=table, con=engine, if_exists="replace", index=False, chunksize=5000)
        engine.dispose()
    except Exception as exc:  # noqa: BLE001
        log(f"     ❌ failed to write table: {exc}")
        return jsonify({"ok": False, "error": f"Failed to write to MySQL: {exc}"}), 500

    log(f"     ✅ created table '{table}' with {len(df)} row(s), {len(df.columns)} column(s)")
    return jsonify({
        "ok": True,
        "table": table,
        "rows": int(len(df)),
        "columns": list(df.columns),
        "database": database,
    })


@app.get("/")
def connectors_page():
    """Serve the standalone connectors workbench (same-origin, so no CORS needed)."""
    resp = send_from_directory(HERE, "connectors.html")
    # Always serve the latest page so browser cache never hides code/UI changes.
    resp.headers["Cache-Control"] = "no-store"
    return resp


@app.get("/health")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8787"))
    print(f"Ana Small local backend listening on http://localhost:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)

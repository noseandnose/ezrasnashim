#!/usr/bin/env python3
"""
simple_csv_to_s3_cdn_parallel.py

- Loads config from .env (same directory) and prompts only for missing values.
- Reads CSV with:
    id,date,title,content,audio_url,speaker,created_at,provider,speaker_website
- Downloads each audio (prefer audio_url; fallback speaker_website)
- Uploads to s3://<S3_BUCKET>/<S3_PREFIX>/<filename> (OVERWRITES)
- Builds CDN URL: <CDN_BASE>/<S3_PREFIX>/<filename>
- Updates DB for successful uploads
- Runs uploads concurrently (default 10 workers)

Usage:
  python simple_csv_to_s3_cdn_parallel.py /path/to/input.csv
"""

import csv
import os
import sys
import re
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
from getpass import getpass
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

import requests
import boto3
import psycopg2
from psycopg2.extras import execute_batch


ENV_FILE = ".env"
MAX_WORKERS = 25  # parallelism

DEFAULTS = {
    "AWS_REGION": "us-east-1",
    "S3_BUCKET": "ezras-nashim-assets",
    "S3_PREFIX": "chizuk/audio",
    "CDN_BASE": "https://assets.ezrasnashim.app",
    "PGPORT": "5432",
    "DB_TABLE": "episodes",
    "ID_COLUMN": "id",
    "URL_COLUMN": "audio_url",
}

AUDIO_CT_TO_EXT = {
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/x-mp3": ".mp3",
    "audio/aac": ".aac",
    "audio/x-aac": ".aac",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/flac": ".flac",
    "audio/ogg": ".ogg",
    "audio/opus": ".opus",
    "audio/webm": ".webm",
}

# ----------- simple .env loader/saver (no deps) -----------
def load_env(path: str) -> dict:
    data = {}
    if not os.path.exists(path):
        return data
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line or line.strip().startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                data[k.strip()] = v.strip()
    return data


def save_env(path: str, data: dict) -> None:
    existing = []
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            existing = f.readlines()

    keys_written = set()
    out_lines = []

    for line in existing:
        if not line.strip() or line.strip().startswith("#") or "=" not in line:
            out_lines.append(line)
            continue
        k, _ = line.split("=", 1)
        k = k.strip()
        if k in data:
            out_lines.append(f"{k}={data[k]}\n")
            keys_written.add(k)
        else:
            out_lines.append(line)

    for k, v in data.items():
        if k not in keys_written:
            out_lines.append(f"{k}={v}\n")

    with open(path, "w", encoding="utf-8") as f:
        f.writelines(out_lines)


def prompt_missing(env: dict) -> dict:
    updated = dict(env)  # copy

    def _ask(key, prompt_text, default=None, secret=False):
        if updated.get(key):
            return
        prompt_full = f"{prompt_text} [{default}]: " if default else f"{prompt_text}: "
        val = getpass(prompt_full).strip() if secret else input(prompt_full).strip()
        if not val and default is not None:
            val = default
        updated[key] = val

    # AWS
    _ask("AWS_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID")
    _ask("AWS_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY", secret=True)
    _ask("AWS_REGION", "AWS_REGION", DEFAULTS["AWS_REGION"])

    # S3
    _ask("S3_BUCKET", "S3 bucket name", DEFAULTS["S3_BUCKET"])
    _ask("S3_PREFIX", "S3 prefix/path (no leading slash)", DEFAULTS["S3_PREFIX"])

    # CDN
    _ask("CDN_BASE", "CloudFront base URL", DEFAULTS["CDN_BASE"])

    # DB
    _ask("PGHOST", "Postgres host")
    _ask("PGPORT", "Postgres port", DEFAULTS["PGPORT"])
    _ask("PGUSER", "Postgres user")
    _ask("PGPASSWORD", "Postgres password", secret=True)
    _ask("PGDATABASE", "Postgres database name")

    # DB table + columns
    _ask("DB_TABLE", "DB table to update", DEFAULTS["DB_TABLE"])
    _ask("ID_COLUMN", "DB ID column", DEFAULTS["ID_COLUMN"])
    _ask("URL_COLUMN", "DB URL column to set", DEFAULTS["URL_COLUMN"])

    return updated


# ----------- helpers -----------
def safe_slug(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "audio"


def pick_ext(url: str, resp_headers: dict) -> str:
    ct = (resp_headers.get("Content-Type") or "").split(";")[0].strip().lower()
    if ct in AUDIO_CT_TO_EXT:
        return AUDIO_CT_TO_EXT[ct]
    guess = os.path.splitext(urlparse(url).path)[1]
    if guess:
        return guess
    if ct:
        m = mimetypes.guess_extension(ct)
        if m:
            return m
    return ".mp3"


def build_key(prefix: str, filename: str) -> str:
    prefix = prefix.strip().strip("/")
    return f"{prefix}/{filename}" if prefix else filename


def build_cdn_url(base: str, key: str) -> str:
    return f"{base.rstrip('/')}/{key}"


# ----------- per-thread requests session -----------
_thread_local = threading.local()

def get_session() -> requests.Session:
    """
    Create a requests.Session per thread for connection pooling without cross-thread sharing.
    """
    sess = getattr(_thread_local, "session", None)
    if sess is None:
        sess = requests.Session()
        _thread_local.session = sess
    return sess


# ----------- worker -----------
def process_row(row, s3_client, bucket, prefix, cdn_base):
    """
    Download & upload one row. Returns (cdn_url, id) on success; raises on failure.
    """
    rec_id = str((row.get("id") or "").strip())
    title = (row.get("title") or "").strip()
    src = (row.get("audio_url") or "").strip() or (row.get("audio_url") or "").strip()

    if not rec_id or not src:
        raise ValueError("missing id or src url")

    sess = get_session()

    # try HEAD (optional) to guess extension/content-type
    headers = {}
    try:
        h = sess.head(src, allow_redirects=True, timeout=(5, 15))
        if h.ok:
            headers = h.headers or {}
    except Exception:
        pass

    ext = pick_ext(src, headers)
    filename = f"{rec_id}-{safe_slug(title)}{ext}"
    key = build_key(prefix, filename)
    cdn_url = build_cdn_url(cdn_base, key)

    # GET stream and upload (overwrite existing)
    with sess.get(src, stream=True, timeout=(15, 120)) as r:
        r.raise_for_status()
        content_type = (r.headers.get("Content-Type") or "").split(";")[0].strip() \
                       or mimetypes.guess_type(filename)[0] \
                       or "application/octet-stream"

        print(f"[upload] id={rec_id} -> s3://{bucket}/{key}")
        s3_client.upload_fileobj(
            Fileobj=r.raw,
            Bucket=bucket,
            Key=key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "public, max-age=31536000, immutable",
            },
        )

    return (cdn_url, rec_id)


# ----------- core -----------
def main():
    if len(sys.argv) != 2:
        print("Usage: python simple_csv_to_s3_cdn_parallel.py /path/to/input.csv")
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        sys.exit(1)

    # Load env, prompt for missing, save back
    env = load_env(ENV_FILE)
    for k, v in DEFAULTS.items():
        env.setdefault(k, v)
    env = prompt_missing(env)
    save_env(ENV_FILE, env)
    print(f"Config saved to {ENV_FILE}")

    # AWS/S3 client (boto3 clients are threadsafe)
    session = boto3.Session(
        aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
        region_name=env["AWS_REGION"],
    )
    s3 = session.client("s3")

    # DB connection (single final batch update)
    conn = psycopg2.connect(
        host=env["PGHOST"],
        port=int(env["PGPORT"]),
        user=env["PGUSER"],
        password=env["PGPASSWORD"],
        dbname=env["PGDATABASE"],
    )
    conn.autocommit = False
    cur = conn.cursor()

    bucket = env["S3_BUCKET"]
    prefix = env["S3_PREFIX"]
    cdn_base = env["CDN_BASE"]
    table = env["DB_TABLE"]
    id_col = env["ID_COLUMN"]
    url_col = env["URL_COLUMN"]

    # Read all rows first (so the pool can iterate)
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    total = len(rows)
    print(f"Rows to process: {total}")

    updates = []   # (cdn_url, id) only for successful uploads
    failed_updates = []
    failed = 0
    skipped = 0
    submitted = 0

    # basic validation of headers
    required = {"id", "speaker_website", "audio_url", "title"}
    missing = required - set([h.strip() for h in (rows[0].keys() if rows else [])])
    if missing:
        print(f"Warning: CSV is missing expected headers: {', '.join(sorted(missing))}")

    # Submit tasks to a thread pool
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for row in rows:
            # skip obviously bad rows early
            rid = str((row.get("id") or "").strip())
            src = (row.get("audio_url") or "").strip() or (row.get("audio_url") or "").strip()
            if not rid or not src:
                skipped += 1
                continue
            fut = executor.submit(process_row, row, s3, bucket, prefix, cdn_base)
            futures[fut] = rid
            submitted += 1

        # Gather results as they complete
        for fut in as_completed(futures):
            rid = futures[fut]
            try:
                cdn_url, rec_id = fut.result()
                updates.append((cdn_url, rec_id))
            except Exception as e:
                failed += 1
                failed_updates.append((cdn_url, rec_id))
                print(f"[error] id={rid}: {e}")

    print(f"Uploads done. success={len(updates)}, failed={failed}, skipped={skipped}, submitted={submitted}")

    # Batch update DB (only for successful uploads)
    if updates:
        sql = f'UPDATE "{table}" SET "{url_col}" = %s WHERE "{id_col}" = %s'
        try:
            print(f"Updating {len(updates)} rows in {table}")
            execute_batch(cur, sql, updates, page_size=500)
            conn.commit()
            print("DB update successful")
        except Exception as e:
            conn.rollback()
            print("DB update failed; rolled back:", e)
            sys.exit(2)
        finally:
            cur.close()
            conn.close()
    else:
        cur.close()
        conn.close()

    if failed_updates:
        print("Failed to upload some rows:")
        for url, id in failed_updates:
            print(f"id={id}, url={url}")
            sql = f'DELETE FROM "{table}" WHERE "{id_col}" = %s'
            try:
                print(f"Deleting failed row {id} from {table}")
                # cur.execute(sql, (id))
                # conn.commit()
                print("Deleted row from DB")
            except Exception as e:
                conn.rollback()
                print("Failed to delete row from DB:", e)
                sys.exit(2)
            finally:
                cur.close()
                conn.close()

    print(f"Done. db_updates={len(updates)}")


if __name__ == "__main__":
    main()

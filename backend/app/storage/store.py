import json
import sqlite3
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from app.config import DATA_DIR, UPLOADS_DIR, JOBS_DIR

DB_PATH = DATA_DIR / "string_art.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    with conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                upload_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                created_at REAL NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                upload_id TEXT NOT NULL,
                status TEXT NOT NULL,
                progress_step INTEGER DEFAULT 0,
                total_steps INTEGER DEFAULT 0,
                current_nail INTEGER DEFAULT 1,
                stopping_reason TEXT,
                error_message TEXT,
                config_json TEXT NOT NULL,
                result_json TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_uploads_session ON uploads(session_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_session ON jobs(session_id)")
    conn.close()

init_db()

class Store:
    @staticmethod
    def save_upload(
        upload_id: str,
        session_id: str,
        original_filename: str,
        file_path: Path,
        file_size: int,
        width: int,
        height: int
    ):
        conn = sqlite3.connect(DB_PATH)
        with conn:
            conn.execute(
                """
                INSERT INTO uploads (upload_id, session_id, original_filename, file_path, file_size, width, height, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (upload_id, session_id, original_filename, str(file_path), file_size, width, height, time.time())
            )
        conn.close()

    @staticmethod
    def get_upload(upload_id: str) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM uploads WHERE upload_id = ?", (upload_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        return dict(row)

    @staticmethod
    def verify_upload_access(upload_id: str, session_id: str) -> bool:
        upload = Store.get_upload(upload_id)
        if not upload:
            return False
        return upload["session_id"] == session_id

    @staticmethod
    def create_job(
        job_id: str,
        session_id: str,
        upload_id: str,
        config: Dict[str, Any]
    ):
        now = time.time()
        conn = sqlite3.connect(DB_PATH)
        with conn:
            conn.execute(
                """
                INSERT INTO jobs (job_id, session_id, upload_id, status, progress_step, total_steps, config_json, created_at, updated_at)
                VALUES (?, ?, ?, 'queued', 0, ?, ?, ?, ?)
                """,
                (job_id, session_id, upload_id, config.get("steps", 3000), json.dumps(config), now, now)
            )
        conn.close()

    @staticmethod
    def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        d["config"] = json.loads(d["config_json"]) if d["config_json"] else {}
        d["result"] = json.loads(d["result_json"]) if d["result_json"] else None
        return d

    @staticmethod
    def verify_job_access(job_id: str, session_id: str) -> bool:
        job = Store.get_job(job_id)
        if not job:
            return False
        return job["session_id"] == session_id

    @staticmethod
    def update_job_progress(
        job_id: str,
        progress_step: int,
        total_steps: int,
        current_nail: int
    ):
        conn = sqlite3.connect(DB_PATH)
        with conn:
            # Only update if still running or queued
            conn.execute(
                """
                UPDATE jobs 
                SET progress_step = ?, total_steps = ?, current_nail = ?, status = 'running', updated_at = ?
                WHERE job_id = ? AND status IN ('queued', 'running')
                """,
                (progress_step, total_steps, current_nail, time.time(), job_id)
            )
        conn.close()

    @staticmethod
    def request_job_cancellation(job_id: str) -> bool:
        """Sets status to cancelling if job is queued or running."""
        conn = sqlite3.connect(DB_PATH)
        with conn:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE jobs
                SET status = 'cancelling', updated_at = ?
                WHERE job_id = ? AND status IN ('queued', 'running')
                """,
                (time.time(), job_id)
            )
            affected = cur.rowcount > 0
        conn.close()
        return affected

    @staticmethod
    def is_job_cancelled(job_id: str) -> bool:
        job = Store.get_job(job_id)
        if not job:
            return True
        return job["status"] in ("cancelling", "cancelled")

    @staticmethod
    def complete_job(
        job_id: str,
        result: Dict[str, Any],
        stopping_reason: str
    ):
        now = time.time()
        conn = sqlite3.connect(DB_PATH)
        with conn:
            # Crucial requirement: cancellation cannot be overwritten by later success
            conn.execute(
                """
                UPDATE jobs
                SET status = CASE 
                    WHEN status = 'cancelling' THEN 'cancelled'
                    ELSE 'completed'
                END,
                stopping_reason = ?,
                result_json = ?,
                progress_step = ?,
                updated_at = ?
                WHERE job_id = ? AND status != 'cancelled'
                """,
                (stopping_reason, json.dumps(result), result.get("total_lines", 0), now, job_id)
            )
        conn.close()

    @staticmethod
    def fail_job(job_id: str, error_message: str):
        now = time.time()
        conn = sqlite3.connect(DB_PATH)
        with conn:
            conn.execute(
                """
                UPDATE jobs
                SET status = 'failed', error_message = ?, updated_at = ?
                WHERE job_id = ? AND status != 'cancelled'
                """,
                (error_message, now, job_id)
            )
        conn.close()

    @staticmethod
    def get_job_dir(job_id: str) -> Path:
        p = JOBS_DIR / job_id
        p.mkdir(parents=True, exist_ok=True)
        return p

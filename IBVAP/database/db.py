from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "ibvap.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 10000")
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                camera_id TEXT,
                object_type TEXT,
                track_id INTEGER,
                event_type TEXT,
                confidence REAL,
                snapshot_path TEXT,
                plate_number TEXT
            )
            """
        )
        conn.commit()


def log_event(
    camera_id: str,
    object_type: str,
    track_id: int | None,
    event_type: str,
    confidence: float | None,
    snapshot_path: str | None = None,
    plate_number: str | None = None,
) -> None:
    init_db()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO events
                (timestamp, camera_id, object_type, track_id,
                 event_type, confidence, snapshot_path, plate_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                camera_id,
                object_type,
                track_id,
                event_type,
                confidence,
                snapshot_path,
                plate_number,
            ),
        )
        conn.commit()


def _normalise_row(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    for key in ("id", "track_id"):
        value = item.get(key)
        # Older runs inserted NumPy integer scalars into SQLite as BLOBs.
        # Convert those historical values back to JSON-safe integers.
        if isinstance(value, bytes) and 0 < len(value) <= 8:
            item[key] = int.from_bytes(value, byteorder="little", signed=True)
    return item


def get_all_events() -> list[dict[str, Any]]:
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY timestamp DESC, id DESC"
        ).fetchall()
    return [_normalise_row(row) for row in rows]


def get_events_by_type(event_type: str) -> list[dict[str, Any]]:
    init_db()
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM events WHERE event_type = ? ORDER BY timestamp DESC, id DESC",
            (event_type,),
        ).fetchall()
    return [_normalise_row(row) for row in rows]

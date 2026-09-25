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
);

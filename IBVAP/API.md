# IBVAP API Contract

Base URL when running locally: `http://127.0.0.1:8000`

## JSON contract

Successful JSON responses use:

```json
{"ok": true, "data": {}, "message": "..."}
```

Errors use:

```json
{"ok": false, "error": {"code": "...", "message": "..."}}
```

File/media endpoints return the requested media directly.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API, model, database and source health |
| GET | `/api/stats` | Current event/detection statistics |
| GET | `/api/events` | Event records; optional `limit` and `event_type` |
| GET | `/api/events/latest` | Most recent event |
| POST | `/api/detection/start` | Start one background detection job |
| GET | `/api/detection/status` | Current job state |
| POST | `/api/detection/reset` | Reset state when no job is running |
| GET | `/api/video/{filename}` | Serve one whitelisted local video |
| GET | `/api/stream` | MJPEG view of processing/output video; not an IP-camera feed |
| GET | `/api/output-video` | Serve final H.264 browser-compatible MP4 |
| GET | `/api/camera/frame` | Return the first frame of the configured local CCTV video |
| GET | `/api/evidence` | List evidence records with safe URLs |
| GET | `/api/evidence/{filename}` | Serve one evidence snapshot |

## Start detection

```json
POST /api/detection/start
{
  "camera_id": "CAM_01",
  "video": "cctv.mp4",
  "fence_points": [[50,50],[590,50],[590,430],[50,430]]
}
```

The video name is restricted to a filename in the project root and must use a supported video extension.

## Job states

`IDLE` → `STARTING` → `RUNNING` → `COMPLETED`

A processing failure ends in `FAILED`.

Only one job can run at a time. Output files are removed before a new job begins and the browser-compatible video is created only after the AI/ANPR pipeline completes.

## Active AI pipeline

`FastAPI → intrusion_susact.run_detection → YOLO object detection + ByteTrack + YOLO pose → virtual-fence/suspicious-activity logic → SQLite/CSV/snapshots → ANPR → browser-compatible output video`

`face_reco.py` and `night_detection_test.py` remain standalone and are not exposed as active API features.

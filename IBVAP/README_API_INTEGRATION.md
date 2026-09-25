# IBVAP API Integration — Audit and Implementation

## Result

The integration layer is now organized as:

`New frontend → FastAPI → detection worker → YOLO/ByteTrack/Pose → intrusion/suspicious activity → SQLite/CSV/evidence → ANPR → browser MP4 → FastAPI → frontend`

The existing AI algorithm in `backend/intrusion_susact.py` was preserved. Changes focus on API integration, state handling, path correctness, ANPR invocation, database safety, and frontend communication.

## Important audit findings

1. The uploaded new frontend originally contained no `fetch()`/XHR/API calls; its surveillance metrics, events and camera view were static UI data.
2. `main.py` used `ROOT/logs/snapshots`, while the active detector writes to `backend/logs/snapshots`.
3. `main.py` called `anpr_numberplate.main(input_video=..., output_video=...)`, but the original ANPR `main()` accepted no parameters. This was a real broken integration.
4. The ANPR plate-model path was relative to `backend/models`, while the actual model is `models/iitj_cv_bharat_plate.pt` at project root.
5. ANPR originally used a hard-coded user Downloads video path instead of the API pipeline's temporary annotated video.
6. The active detector hard-coded `device=0` and `half=True`; the integration now selects CUDA when available and CPU otherwise.
7. `face_reco.py` and `night_detection_test.py` are standalone and are not exposed as active API features.
8. The existing SQLite database contains historical NumPy integer BLOB values in `track_id`; the database reader normalizes these to JSON-safe integers.
9. The original frontend login was only a client-side CAPTCHA gate, not authentication. The UI now states that backend authentication is not implemented.

## Active functionality

- YOLO object detection
- ByteTrack tracking
- YOLO pose estimation
- virtual-fence intrusion detection
- suspicious-activity heuristics
- evidence snapshots
- CSV event logging
- SQLite event logging
- ANPR with plate detector + PaddleOCR + temporal voting/Indian-format validation
- processed video generation
- browser-compatible H.264 conversion

## Not active through the API

- `face_reco.py`
- `night_detection_test.py`
- RTSP/IP camera input
- backend authentication
- true multi-camera live CCTV

`/api/stream` is an MJPEG representation of the configured local processing video/live callback. It is not an RTSP/IP-camera service.

## Run

From the project root:

```bash
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Open the landing page at `http://127.0.0.1:8000/` and the dashboard at `http://127.0.0.1:8000/dashboard`.

Swagger/OpenAPI: `http://127.0.0.1:8000/docs`

## Starting detection

The dashboard has a small FastAPI control panel. Enter a polygon with at least three points, for example:

```text
[[50,50],[590,50],[590,430],[50,430]]
```

and click **START DETECTION**.

The backend rejects duplicate jobs with HTTP 409 and rejects invalid fence/video requests with 400/422 responses.

## Verification status

### Verified in this environment

- Python syntax for project Python modules
- JavaScript syntax for the new frontend scripts
- FastAPI application import
- OpenAPI generation
- `/api/health`
- `/api/stats`
- `/api/events`
- `/api/events/latest`
- `/api/detection/status`
- invalid detection request handling
- path validation
- output-video missing-file handling
- evidence serving
- frontend landing/dashboard HTTP routes
- source video readability
- model file presence
- configured evidence path consistency

### NOT VERIFIED

Full YOLO/ByteTrack/Pose/ANPR inference was not run in this environment because the environment has CPU-only PyTorch and does not have the runtime packages `ultralytics`, `paddleocr`, and `paddlepaddle` installed. No fake AI success was reported.

The packaged model files themselves are present:

- `backend/yolo26n.pt`
- `backend/yolo11n-pose.pt`
- `models/iitj_cv_bharat_plate.pt`

## Configuration

Environment variables:

- `IBVAP_HOST` — default `127.0.0.1`
- `IBVAP_PORT` — default `8000`
- `IBVAP_CORS_ORIGINS` — comma-separated origins; local FastAPI origins are the default

from __future__ import annotations

import datetime as dt
import importlib.util
import os
import shutil
import subprocess
import threading
import time
import uuid
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator


# ============================================================
# CONFIGURATION
# ============================================================

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "frontend"
BACKEND_DIR = ROOT / "backend"
DATABASE_DIR = ROOT / "database"

VIDEO_PATH = ROOT / "cctv.mp4"
MODEL_PATH = BACKEND_DIR / "yolo26n.pt"
POSE_MODEL_PATH = BACKEND_DIR / "yolo11n-pose.pt"
PLATE_MODEL_PATH = ROOT / "models" / "iitj_cv_bharat_plate.pt"

OUTPUT_PATH = ROOT / "intrusion_result.mp4"
BROWSER_OUTPUT_PATH = ROOT / "intrusion_browser.mp4"
ANPR_INPUT_PATH = ROOT / "intrusion_anpr_input.mp4"
ANPR_OUTPUT_PATH = ROOT / "anpr_result.mp4"
ANPR_BROWSER_OUTPUT_PATH = ROOT / "anpr_browser.mp4"
FACE_OUTPUT_PATH = ROOT / "face_result.mp4"
FACE_BROWSER_OUTPUT_PATH = ROOT / "face_browser.mp4"
NIGHT_OUTPUT_PATH = ROOT / "night_result.mp4"
NIGHT_BROWSER_OUTPUT_PATH = ROOT / "night_browser.mp4"

# IMPORTANT: the detector actually writes evidence here.
SNAPSHOT_DIR = BACKEND_DIR / "logs" / "snapshots"
CSV_LOG_PATH = BACKEND_DIR / "logs" / "intrusion_log.csv"
DB_PATH = DATABASE_DIR / "ibvap.db"

HOST = os.getenv("IBVAP_HOST", "127.0.0.1")
PORT = int(os.getenv("IBVAP_PORT", "8000"))

_default_origins = "http://127.0.0.1:8000,http://localhost:8000"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("IBVAP_CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
VIDEO_FILES = {
    "cctv.mp4": VIDEO_PATH,
    "intrusion_result.mp4": OUTPUT_PATH,
    "intrusion_browser.mp4": BROWSER_OUTPUT_PATH,
}

for directory in (SNAPSHOT_DIR, DATABASE_DIR, BACKEND_DIR / "logs"):
    directory.mkdir(parents=True, exist_ok=True)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="IBVAP API",
    description="API integration layer for the IBVAP AI/CV surveillance pipeline.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


# ============================================================
# API MODELS
# ============================================================

class DetectionRequest(BaseModel):
    fence_points: list[list[int]] = Field(..., min_length=3, max_length=20)
    camera_id: str = Field(default="CAM_01", min_length=1, max_length=64)
    video: str = Field(default="cctv.mp4", min_length=1, max_length=128)

    @field_validator("fence_points")
    @classmethod
    def validate_fence(cls, points: list[list[int]]) -> list[list[int]]:
        for point in points:
            if len(point) != 2:
                raise ValueError("Each fence point must contain exactly [x, y].")
            if point[0] < 0 or point[1] < 0:
                raise ValueError("Fence coordinates cannot be negative.")
        return points


class DetectionState:
    def __init__(self) -> None:
        self.lock = threading.RLock()
        self.status = "IDLE"
        self.job_id: str | None = None
        self.started_at: float | None = None
        self.finished_at: float | None = None
        self.error: str | None = None
        self.result: dict[str, Any] | None = None
        self.fence_points: list[list[int]] = []
        self.camera_id = "CAM_01"
        self.thread: threading.Thread | None = None
        self.live_frame: bytes | None = None

    def snapshot(self) -> dict[str, Any]:
        with self.lock:
            result = self.result or {}
            return {
                "job_id": self.job_id,
                "status": self.status,
                "camera_id": self.camera_id,
                "fence_points": self.fence_points,
                "started_at": self.started_at,
                "finished_at": self.finished_at,
                "error": self.error,
                "frames_processed": int(result.get("frames_processed", 0)),
                "intrusion_count": int(result.get("intrusion_events", 0)),
                "suspicious_count": int(result.get("suspicious_events", 0)),
                "output_video": bool(result.get("output_video")),
                "browser_video": bool(result.get("browser_video")),
            }


state = DetectionState()


def success(data: Any, message: str = "") -> dict[str, Any]:
    return {"ok": True, "data": data, "message": message}


def api_error(code: str, message: str) -> dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message}}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "ok": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": exc.errors(),
            },
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = {
        400: "BAD_REQUEST",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_ERROR",
    }.get(exc.status_code, "API_ERROR")
    message = str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=api_error(code, message),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Technical details stay server-side.
    print(f"[IBVAP API] Unhandled error: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content=api_error("INTERNAL_ERROR", "The server could not complete the request."),
    )


# ============================================================
# DATABASE HELPERS
# ============================================================

def _db_events() -> list[dict[str, Any]]:
    from database.db import get_all_events, init_db

    init_db()
    return get_all_events()


def _json_safe(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


# ============================================================
# PATH / VIDEO SAFETY
# ============================================================

def _resolve_video(name: str) -> Path:
    if Path(name).name != name:
        raise HTTPException(400, "Video name must be a filename, not a filesystem path.")

    path = (ROOT / name).resolve()
    if path.parent != ROOT:
        raise HTTPException(400, "Invalid video name.")

    if path.suffix.lower() not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(422, "Unsupported video format.")

    if not path.exists() or not path.is_file():
        raise HTTPException(404, "Video not found.")

    return path


def _load_anpr_module():
    candidates = [
        BACKEND_DIR / "anpr_numberplate.py",
        BACKEND_DIR / "anpr_numberplate (1).py",
    ]
    module_path = next((p for p in candidates if p.exists()), None)
    if module_path is None:
        raise FileNotFoundError("ANPR module not found.")

    spec = importlib.util.spec_from_file_location("ibvap_anpr", module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load ANPR module: {module_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_browser_video(source: Path, destination: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Processed video not found: {source}")

    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    temporary_output = destination.with_name(destination.stem + "_tmp.mp4")
    temporary_output.unlink(missing_ok=True)

    command = [
        ffmpeg, "-y", "-i", str(source),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", "-an", str(temporary_output),
    ]
    completed = subprocess.run(command, capture_output=True, text=True)
    if completed.returncode != 0:
        temporary_output.unlink(missing_ok=True)
        raise RuntimeError("FFmpeg could not create the browser-compatible video.")

    temporary_output.replace(destination)


# ============================================================
# DETECTION WORKER
# ============================================================

def _run_detection(req: DetectionRequest, video_path: Path, job_id: str) -> None:
    try:
        from backend.intrusion_susact import run_detection

        with state.lock:
            state.status = "RUNNING"
            state.live_frame = None

        result = run_detection(
            video_path=str(video_path),
            fence_points=[tuple(point) for point in req.fence_points],
            output_path=str(OUTPUT_PATH),
            camera_id=req.camera_id,
            show_window=False,
            live_callback=update_live_frame,
        )

        if not OUTPUT_PATH.exists() or OUTPUT_PATH.stat().st_size == 0:
            raise FileNotFoundError("Intrusion detection did not create a valid output video.")

        # Camera Surveillance is intentionally independent from ANPR.
        # ANPR has its own API job below so a human-intrusion run does not
        # become an unnecessarily long vehicle/OCR pipeline.
        make_browser_video(OUTPUT_PATH, BROWSER_OUTPUT_PATH)

        final_result = dict(result)
        final_result["output_video"] = str(OUTPUT_PATH.resolve())
        final_result["browser_video"] = str(BROWSER_OUTPUT_PATH.resolve())

        with state.lock:
            state.result = final_result
            state.status = "COMPLETED"
            state.error = None
            state.finished_at = time.time()

    except Exception as exc:
        print(f"[IBVAP] Detection job {job_id} failed: {type(exc).__name__}: {exc}")
        with state.lock:
            state.status = "FAILED"
            state.error = f"{type(exc).__name__}: {exc}"
            state.finished_at = time.time()
    finally:
        ANPR_INPUT_PATH.unlink(missing_ok=True)
        if FEATURE_JOB_LOCK.locked():
            try:
                FEATURE_JOB_LOCK.release()
            except RuntimeError:
                pass


def update_live_frame(frame) -> None:
    ok, encoded = cv2.imencode(
        ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82]
    )
    if ok:
        with state.lock:
            state.live_frame = encoded.tobytes()


# ============================================================
# HEALTH / STATS / EVENTS
# ============================================================

@app.get("/api/health")
def health() -> dict[str, Any]:
    return success(
        {
            "api": "online",
            "status": state.status,
            "models": {
                "object_detection": MODEL_PATH.exists(),
                "pose": POSE_MODEL_PATH.exists(),
                "plate": PLATE_MODEL_PATH.exists(),
            },
            "database": DB_PATH.exists(),
            "camera_source": VIDEO_PATH.exists(),
            "frontend": FRONTEND_DIR.exists(),
        },
        "IBVAP API is online.",
    )


@app.get("/api/stats")
def stats() -> dict[str, Any]:
    events = _db_events()
    intrusion_events = [e for e in events if e.get("event_type") == "intrusion"]
    suspicious_events = [e for e in events if e.get("event_type") == "suspicious_activity"]
    plate_events = [e for e in events if e.get("event_type") == "plate_read"]

    confidences = [
        float(e["confidence"])
        for e in events
        if e.get("confidence") is not None
    ]

    with state.lock:
        result = state.result or {}
        frames = int(result.get("frames_processed", 0))

    return success(
        {
            "active_camera": state.camera_id,
            "active_intrusions": len(intrusion_events),
            "ai_events": len(events),
            "intrusion_events": len(intrusion_events),
            "suspicious_events": len(suspicious_events),
            "plates_read": len(plate_events),
            "ai_confidence": round(sum(confidences) / len(confidences) * 100, 1) if confidences else 0,
            "frames_processed": frames,
            "detection_status": state.status,
        },
        "Current IBVAP statistics.",
    )


@app.get("/api/events")
def events(
    limit: int = Query(100, ge=1, le=500),
    event_type: str | None = Query(None, max_length=64),
) -> dict[str, Any]:
    rows = _db_events()
    if event_type:
        rows = [row for row in rows if row.get("event_type") == event_type]
    return success(_json_safe(rows[:limit]), "Event records retrieved.")


@app.get("/api/events/latest")
def latest_event() -> dict[str, Any]:
    rows = _db_events()
    return success(_json_safe(rows[0] if rows else None), "Latest event retrieved.")


# ============================================================
# FEATURE JOB API (ANPR / FACE / NIGHT)
# ============================================================

class FeatureRequest(BaseModel):
    camera_id: str = Field(default="CAM_01", min_length=1, max_length=64)
    video: str = Field(default="cctv.mp4", min_length=1, max_length=128)
    fence_points: list[list[int]] = Field(default_factory=list, max_length=20)

    @field_validator("fence_points")
    @classmethod
    def validate_feature_fence(cls, points: list[list[int]]) -> list[list[int]]:
        for point in points:
            if len(point) != 2 or point[0] < 0 or point[1] < 0:
                raise ValueError("Fence points must be [x, y] with non-negative coordinates.")
        return points


class FeatureState:
    def __init__(self, name: str):
        self.name = name
        self.lock = threading.RLock()
        self.status = "IDLE"
        self.job_id: str | None = None
        self.camera_id = "CAM_01"
        self.started_at: float | None = None
        self.finished_at: float | None = None
        self.error: str | None = None
        self.result: dict[str, Any] = {}
        self.thread: threading.Thread | None = None
        self.fence_points: list[list[int]] = []

    def snapshot(self) -> dict[str, Any]:
        with self.lock:
            return {
                "job_id": self.job_id,
                "status": self.status,
                "camera_id": self.camera_id,
                "started_at": self.started_at,
                "finished_at": self.finished_at,
                "error": self.error,
                "fence_points": self.fence_points,
                **self.result,
            }


anpr_state = FeatureState("ANPR")
face_state = FeatureState("FACE")
night_state = FeatureState("NIGHT")
FEATURE_STATES = (anpr_state, face_state, night_state)
FEATURE_JOB_LOCK = threading.Lock()


def _feature_video_path(name: str, *, night: bool = False) -> Path:
    if name and name != "cctv.mp4":
        return _resolve_video(name)
    candidates = [
        ROOT / "cctv.mp4",
        BACKEND_DIR / "cctv.mp4",
    ]
    if night:
        candidates += [
            ROOT / "data" / "raw" / "night_vision_1.mp4",
            BACKEND_DIR / "data" / "raw" / "night_vision_1.mp4",
        ]
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate
    raise HTTPException(404, "Feature input video was not found.")


def _feature_busy() -> str | None:
    for feature in FEATURE_STATES:
        with feature.lock:
            if feature.status in {"STARTING", "RUNNING"}:
                return feature.name
    with state.lock:
        if state.status in {"STARTING", "RUNNING"}:
            return "CAMERA"
    return None


def _begin_feature(feature: FeatureState, req: FeatureRequest, target, video_path: Path) -> dict[str, Any]:
    busy = _feature_busy()
    if busy:
        raise HTTPException(409, f"{busy} processing is already running.")
    if not FEATURE_JOB_LOCK.acquire(blocking=False):
        raise HTTPException(409, "Another AI processing job is already running.")

    job_id = uuid.uuid4().hex
    with feature.lock:
        feature.job_id = job_id
        feature.status = "STARTING"
        feature.camera_id = req.camera_id
        feature.fence_points = req.fence_points
        feature.started_at = time.time()
        feature.finished_at = None
        feature.error = None
        feature.result = {}
        worker = threading.Thread(
            target=target,
            args=(req, video_path, job_id),
            name=f"ibvap-{feature.name.lower()}-{job_id[:8]}",
            daemon=True,
        )
        feature.thread = worker
        worker.start()
    return feature.snapshot()


def _finish_feature(feature: FeatureState, job_id: str, result: dict[str, Any] | None = None, error: Exception | None = None):
    with feature.lock:
        if error:
            feature.status = "FAILED"
            feature.error = f"{type(error).__name__}: {error}"
            feature.result = result or {}
        else:
            feature.status = "COMPLETED"
            feature.error = None
            feature.result = result or {}
        feature.finished_at = time.time()
    FEATURE_JOB_LOCK.release()


def _run_anpr(req: FeatureRequest, video_path: Path, job_id: str) -> None:
    try:
        with anpr_state.lock:
            anpr_state.status = "RUNNING"
        if not PLATE_MODEL_PATH.exists():
            raise FileNotFoundError(f"ANPR plate model not found: {PLATE_MODEL_PATH}")
        ANPR_OUTPUT_PATH.unlink(missing_ok=True)
        ANPR_BROWSER_OUTPUT_PATH.unlink(missing_ok=True)
        module = _load_anpr_module()
        result = module.main(
            input_video=str(video_path),
            output_video=str(ANPR_OUTPUT_PATH),
            vehicle_model_path=str(MODEL_PATH),
            plate_model_path=str(PLATE_MODEL_PATH),
        ) or {}
        if not ANPR_OUTPUT_PATH.exists() or ANPR_OUTPUT_PATH.stat().st_size == 0:
            raise FileNotFoundError("ANPR did not create an output video.")
        make_browser_video(ANPR_OUTPUT_PATH, ANPR_BROWSER_OUTPUT_PATH)
        confirmed = result.get("confirmed_plates", {})
        try:
            from database.db import log_event
            for track_id, plate in confirmed.items():
                log_event(camera_id=req.camera_id, object_type="vehicle", track_id=int(track_id),
                          event_type="plate_read", confidence=None, snapshot_path=None,
                          plate_number=str(plate))
        except Exception as exc:
            print(f"[IBVAP] ANPR event logging warning: {exc}")
        result.update({
            "plates_count": len(confirmed),
            "output_video": "/api/video/anpr_result.mp4",
            "browser_video": "/api/video/anpr_browser.mp4",
        })
        _finish_feature(anpr_state, job_id, result=result)
    except Exception as exc:
        print(f"[IBVAP] ANPR job {job_id} failed: {type(exc).__name__}: {exc}")
        _finish_feature(anpr_state, job_id, error=exc)


def _run_face(req: FeatureRequest, video_path: Path, job_id: str) -> None:
    try:
        with face_state.lock:
            face_state.status = "RUNNING"
        from backend.face_reco import FaceRecognizer
        known_dirs = [ROOT / "known_faces", BACKEND_DIR / "known_faces"]
        known_dir = next((p for p in known_dirs if p.exists()), known_dirs[0])
        recognizer = FaceRecognizer(known_faces_dir=str(known_dir))
        FACE_OUTPUT_PATH.unlink(missing_ok=True)
        FACE_BROWSER_OUTPUT_PATH.unlink(missing_ok=True)
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Could not open face input video: {video_path}")
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 360
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        writer = cv2.VideoWriter(str(FACE_OUTPUT_PATH), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
        if not writer.isOpened():
            cap.release()
            raise RuntimeError("Could not create face output video.")
        frames = 0
        detected = 0
        identities: dict[str, int] = {}
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frames += 1
            face = recognizer.detect_face(frame)
            if face is not None:
                detected += 1
                name, score = recognizer.identify_face(face)
                x1, y1, x2, y2 = map(int, face.bbox)
                label = f"{name}" + (f" {score:.2f}" if score is not None else "")
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 220, 0), 2)
                cv2.putText(frame, label, (x1, max(25, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 0), 2)
                identities[name] = identities.get(name, 0) + 1
            writer.write(frame)
        cap.release()
        writer.release()
        if not FACE_OUTPUT_PATH.exists() or FACE_OUTPUT_PATH.stat().st_size == 0:
            raise FileNotFoundError("Face recognition did not create an output video.")
        make_browser_video(FACE_OUTPUT_PATH, FACE_BROWSER_OUTPUT_PATH)
        _finish_feature(face_state, job_id, result={
            "frames_processed": frames,
            "faces_detected": detected,
            "identities": identities,
            "known_faces": len(recognizer.known_names),
            "output_video": "/api/video/face_result.mp4",
            "browser_video": "/api/video/face_browser.mp4",
        })
    except Exception as exc:
        print(f"[IBVAP] Face job {job_id} failed: {type(exc).__name__}: {exc}")
        _finish_feature(face_state, job_id, error=exc)


def _apply_clahe(frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)


def _run_night(req: FeatureRequest, video_path: Path, job_id: str) -> None:
    try:
        with night_state.lock:
            night_state.status = "RUNNING"
        from backend.detector import Detector
        model_candidates = [BACKEND_DIR / "yolov8n.pt", MODEL_PATH]
        model_path = next((p for p in model_candidates if p.exists()), None)
        if model_path is None:
            raise FileNotFoundError("No YOLO model is available for Night Vision.")
        detector = Detector(model_path=str(model_path))
        NIGHT_OUTPUT_PATH.unlink(missing_ok=True)
        NIGHT_BROWSER_OUTPUT_PATH.unlink(missing_ok=True)
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Could not open night input video: {video_path}")
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 360
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        writer = cv2.VideoWriter(str(NIGHT_OUTPUT_PATH), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
        if not writer.isOpened():
            cap.release()
            raise RuntimeError("Could not create night output video.")
        polygon = np.array(req.fence_points, dtype=np.int32) if len(req.fence_points) >= 3 else None
        frames = 0
        detections_total = 0
        intrusion_count = 0
        active_intrusions: set[int] = set()
        while True:
            ok, raw = cap.read()
            if not ok:
                break
            frames += 1
            enhanced = _apply_clahe(raw)
            output = enhanced.copy()
            if polygon is not None:
                cv2.polylines(output, [polygon], True, (255, 255, 0), 3)
                overlay = output.copy()
                cv2.fillPoly(overlay, [polygon], (255, 255, 0))
                output = cv2.addWeighted(overlay, 0.15, output, 0.85, 0)
            detections = detector.detect_and_track(enhanced) if frames % 2 == 0 else []
            detections_total += len(detections)
            current: set[int] = set()
            for d in detections:
                x1, y1, x2, y2 = d["bbox"]
                cx, cy = d["centroid"]
                inside = polygon is not None and cv2.pointPolygonTest(polygon, (int(cx), int(cy)), False) >= 0
                if inside:
                    current.add(d["id"])
                    if d["id"] not in active_intrusions:
                        intrusion_count += 1
                    color = (0, 0, 255)
                    label = f"INTRUSION! {d['class']} ID:{d['id']} {d['confidence']:.2f}"
                else:
                    color = (0, 255, 0)
                    label = f"{d['class']} ID:{d['id']} {d['confidence']:.2f}"
                cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)
                cv2.circle(output, (int(cx), int(cy)), 5, color, -1)
                cv2.putText(output, label, (x1, max(25, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            active_intrusions = current
            cv2.putText(output, f"Night Vision | Frame: {frames} | Detections: {len(detections)} | Intrusions: {intrusion_count}",
                        (10, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            writer.write(output)
        cap.release()
        writer.release()
        if not NIGHT_OUTPUT_PATH.exists() or NIGHT_OUTPUT_PATH.stat().st_size == 0:
            raise FileNotFoundError("Night Vision did not create an output video.")
        make_browser_video(NIGHT_OUTPUT_PATH, NIGHT_BROWSER_OUTPUT_PATH)
        _finish_feature(night_state, job_id, result={
            "frames_processed": frames,
            "detections": detections_total,
            "intrusion_count": intrusion_count,
            "output_video": "/api/video/night_result.mp4",
            "browser_video": "/api/video/night_browser.mp4",
        })
    except Exception as exc:
        print(f"[IBVAP] Night job {job_id} failed: {type(exc).__name__}: {exc}")
        _finish_feature(night_state, job_id, error=exc)


def _feature_status_route(feature: FeatureState) -> dict[str, Any]:
    return success(feature.snapshot(), f"{feature.name} state retrieved.")


@app.get("/api/anpr/status")
def anpr_status() -> dict[str, Any]:
    return _feature_status_route(anpr_state)


@app.post("/api/anpr/start")
def anpr_start(req: FeatureRequest) -> dict[str, Any]:
    video = _feature_video_path(req.video)
    if not MODEL_PATH.exists():
        raise HTTPException(500, "YOLO vehicle model is missing.")
    if not PLATE_MODEL_PATH.exists():
        raise HTTPException(500, "ANPR plate model is missing.")
    return success(_begin_feature(anpr_state, req, _run_anpr, video), "ANPR started.")


@app.post("/api/anpr/reset")
def anpr_reset() -> dict[str, Any]:
    with anpr_state.lock:
        if anpr_state.status in {"STARTING", "RUNNING"}:
            raise HTTPException(409, "Cannot reset ANPR while it is running.")
        anpr_state.status = "IDLE"
        anpr_state.job_id = None
        anpr_state.error = None
        anpr_state.result = {}
        anpr_state.finished_at = None
    return success(anpr_state.snapshot(), "ANPR reset.")


@app.get("/api/anpr/video")
def anpr_video() -> FileResponse:
    if not ANPR_BROWSER_OUTPUT_PATH.exists():
        raise HTTPException(404, "ANPR processed video is not available.")
    return FileResponse(ANPR_BROWSER_OUTPUT_PATH, media_type="video/mp4", filename="anpr_browser.mp4")


@app.get("/api/face/status")
def face_status() -> dict[str, Any]:
    return _feature_status_route(face_state)


@app.post("/api/face/start")
def face_start(req: FeatureRequest) -> dict[str, Any]:
    video = _feature_video_path(req.video)
    return success(_begin_feature(face_state, req, _run_face, video), "Face recognition started.")


@app.post("/api/face/reset")
def face_reset() -> dict[str, Any]:
    with face_state.lock:
        if face_state.status in {"STARTING", "RUNNING"}:
            raise HTTPException(409, "Cannot reset face recognition while it is running.")
        face_state.status = "IDLE"
        face_state.job_id = None
        face_state.error = None
        face_state.result = {}
        face_state.finished_at = None
    return success(face_state.snapshot(), "Face recognition reset.")


@app.get("/api/face/video")
def face_video() -> FileResponse:
    if not FACE_BROWSER_OUTPUT_PATH.exists():
        raise HTTPException(404, "Face processed video is not available.")
    return FileResponse(FACE_BROWSER_OUTPUT_PATH, media_type="video/mp4", filename="face_browser.mp4")


@app.get("/api/night/status")
def night_status() -> dict[str, Any]:
    return _feature_status_route(night_state)


@app.post("/api/night/start")
def night_start(req: FeatureRequest) -> dict[str, Any]:
    video = _feature_video_path(req.video, night=True)
    return success(_begin_feature(night_state, req, _run_night, video), "Night Vision started.")


@app.post("/api/night/reset")
def night_reset() -> dict[str, Any]:
    with night_state.lock:
        if night_state.status in {"STARTING", "RUNNING"}:
            raise HTTPException(409, "Cannot reset Night Vision while it is running.")
        night_state.status = "IDLE"
        night_state.job_id = None
        night_state.error = None
        night_state.result = {}
        night_state.finished_at = None
    return success(night_state.snapshot(), "Night Vision reset.")


@app.get("/api/night/video")
def night_video() -> FileResponse:
    if not NIGHT_BROWSER_OUTPUT_PATH.exists():
        raise HTTPException(404, "Night Vision processed video is not available.")
    return FileResponse(NIGHT_BROWSER_OUTPUT_PATH, media_type="video/mp4", filename="night_browser.mp4")


# ============================================================
# DETECTION JOB API
# ============================================================

@app.get("/api/detection/status")
def detection_status() -> dict[str, Any]:
    return success(state.snapshot(), "Detection state retrieved.")


@app.post("/api/detection/start")
def start_detection(req: DetectionRequest) -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise HTTPException(500, "YOLO object-detection model is missing.")
    if not POSE_MODEL_PATH.exists():
        raise HTTPException(500, "YOLO pose model is missing.")
    video_path = _resolve_video(req.video)

    if len(req.fence_points) < 3:
        raise HTTPException(422, "At least 3 fence points are required.")

    busy = _feature_busy()
    if busy:
        raise HTTPException(409, f"{busy} processing is already running.")
    if not FEATURE_JOB_LOCK.acquire(blocking=False):
        raise HTTPException(409, "Another AI processing job is already running.")

    job_id = uuid.uuid4().hex

    with state.lock:
        if state.status in {"STARTING", "RUNNING"}:
            raise HTTPException(409, "Detection is already running.")

        # Remove only final/stale artifacts before a new job starts.
        for path in (OUTPUT_PATH, BROWSER_OUTPUT_PATH, ANPR_INPUT_PATH):
            path.unlink(missing_ok=True)

        state.job_id = job_id
        state.status = "STARTING"
        state.camera_id = req.camera_id
        state.fence_points = req.fence_points
        state.started_at = time.time()
        state.finished_at = None
        state.error = None
        state.result = None
        state.live_frame = None

        worker = threading.Thread(
            target=_run_detection,
            args=(req, video_path, job_id),
            name=f"ibvap-detection-{job_id[:8]}",
            daemon=True,
        )
        state.thread = worker
        worker.start()

    return success(state.snapshot(), "Detection started.")


@app.post("/api/detection/reset")
def reset_detection() -> dict[str, Any]:
    with state.lock:
        if state.status in {"STARTING", "RUNNING"}:
            raise HTTPException(409, "Cannot reset while detection is running.")

        state.status = "IDLE"
        state.job_id = None
        state.started_at = None
        state.finished_at = None
        state.error = None
        state.result = None
        state.fence_points = []
        state.live_frame = None

    return success(state.snapshot(), "Detection state reset.")


# ============================================================
# VIDEO / STREAM API
# ============================================================

@app.get("/api/video/{filename}")
def get_video(filename: str) -> FileResponse:
    path = VIDEO_FILES.get(filename)
    if path is None or not path.exists() or not path.is_file():
        raise HTTPException(404, "Video not found.")
    return FileResponse(path, media_type="video/mp4")


@app.get("/api/camera/frame")
def first_frame() -> StreamingResponse:
    if not VIDEO_PATH.exists():
        raise HTTPException(404, "CCTV source video not found.")

    cap = cv2.VideoCapture(str(VIDEO_PATH))
    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise HTTPException(500, "Could not read the CCTV frame.")

    ok, encoded = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
    if not ok:
        raise HTTPException(500, "Could not encode the CCTV frame.")

    return StreamingResponse(iter([encoded.tobytes()]), media_type="image/jpeg")


def mjpeg_stream():
    last_frame = None

    while True:
        with state.lock:
            status = state.status
            live_frame = state.live_frame

        if status in {"STARTING", "RUNNING"}:
            if live_frame is not None and live_frame != last_frame:
                last_frame = live_frame
                yield (
                    b"--frame\r\nContent-Type: image/jpeg\r\n"
                    b"Cache-Control: no-cache\r\n\r\n" + live_frame + b"\r\n"
                )
            time.sleep(0.03)
            continue

        if status == "COMPLETED" and BROWSER_OUTPUT_PATH.exists():
            cap = cv2.VideoCapture(str(BROWSER_OUTPUT_PATH))
            if not cap.isOpened():
                time.sleep(0.5)
                continue

            fps = cap.get(cv2.CAP_PROP_FPS) or 20.0
            delay = max(0.01, 1.0 / min(fps, 30.0))
            while True:
                ok, frame = cap.read()
                if not ok:
                    cap.release()
                    return
                ok, encoded = cv2.imencode(
                    ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82]
                )
                if ok:
                    yield (
                        b"--frame\r\nContent-Type: image/jpeg\r\n"
                        b"Cache-Control: no-cache\r\n\r\n"
                        + encoded.tobytes() + b"\r\n"
                    )
                time.sleep(delay)
            continue

        # IDLE/FAILED: show a source frame once and then wait. This is not
        # advertised as a real-time CCTV stream.
        if status in {"IDLE", "FAILED"}:
            try:
                if VIDEO_PATH.exists():
                    cap = cv2.VideoCapture(str(VIDEO_PATH))
                    ok, frame = cap.read()
                    cap.release()
                    if ok:
                        ok, encoded = cv2.imencode(
                            ".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82]
                        )
                        if ok:
                            yield (
                                b"--frame\r\nContent-Type: image/jpeg\r\n"
                                b"Cache-Control: no-cache\r\n\r\n"
                                + encoded.tobytes() + b"\r\n"
                            )
            except Exception:
                pass
            time.sleep(0.75)
            continue

        time.sleep(0.1)


@app.get("/api/stream")
def stream() -> StreamingResponse:
    return StreamingResponse(
        mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "Pragma": "no-cache"},
    )


@app.get("/api/output-video")
def output_video() -> FileResponse:
    if not BROWSER_OUTPUT_PATH.exists():
        raise HTTPException(404, "Processed browser-compatible video is not available.")
    return FileResponse(
        BROWSER_OUTPUT_PATH,
        media_type="video/mp4",
        filename="intrusion_browser.mp4",
        content_disposition_type="inline",
    )


# ============================================================
# EVIDENCE API
# ============================================================

@app.get("/api/evidence")
def evidence_list(limit: int = Query(50, ge=1, le=200)) -> dict[str, Any]:
    rows = _db_events()
    output = []
    for row in rows[:limit]:
        snapshot = row.get("snapshot_path")
        if snapshot:
            name = Path(snapshot).name
            actual = (SNAPSHOT_DIR / name).resolve()
            if actual.parent == SNAPSHOT_DIR.resolve() and actual.exists():
                output.append({**row, "evidence_url": f"/api/evidence/{name}"})
    return success(_json_safe(output), "Evidence records retrieved.")


@app.get("/api/evidence/{filename}")
def evidence(filename: str) -> FileResponse:
    if Path(filename).name != filename:
        raise HTTPException(400, "Invalid evidence filename.")

    path = (SNAPSHOT_DIR / filename).resolve()
    if path.parent != SNAPSHOT_DIR.resolve() or not path.exists() or not path.is_file():
        raise HTTPException(404, "Evidence not found.")

    return FileResponse(path, media_type="image/jpeg")


# ============================================================
# FRONTEND
# ============================================================

@app.get("/")
def landing_page() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "ibvap.html")

@app.get("/dashboard", include_in_schema=False)
def dashboard_redirect():
    return RedirectResponse(url="/dashboard/", status_code=307)


@app.get("/dashboard/", include_in_schema=False)
def dashboard_page() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "Dashboard" / "index.html")


@app.get("/dashboard/styles.css")
def dashboard_styles() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "Dashboard" / "styles.css")


@app.get("/dashboard/script.js")
def dashboard_script() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "Dashboard" / "script.js")


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="site")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)

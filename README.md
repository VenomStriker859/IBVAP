<div align="center">

🚨 IBVAP

Intelligent Border Video Analysis Platform

Video Intelligence for Intrusion Detection, Behavioral Analysis & ANPR

<p>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="https://opencv.org/"><img src="https://img.shields.io/badge/OpenCV-Computer%20Vision-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV"></a>
  <a href="https://www.ultralytics.com/"><img src="https://img.shields.io/badge/Ultralytics-YOLO-111111?style=for-the-badge" alt="Ultralytics YOLO"></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"></a>
</p>

Current implementation: FastAPI + static HTML/CSS/JavaScript + OpenCV + Ultralytics YOLO/ByteTrack + YOLO pose + PaddleOCR + SQLite.

This documentation reflects the supplied API-based codebase, not the older Streamlit workflow.

</div>

🧭 Quick Navigation

Overview · Features · Architecture · AI Pipeline · Installation · API · Frontend · Known Issues · Roadmap

⚡ Quick Start

# 1. Clone
git clone <YOUR_REPOSITORY_URL>
cd IBVAP

# 2. Create environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
# source .venv/bin/activate

# 3. Install the Python packages used by the project
pip install fastapi uvicorn pydantic opencv-python numpy torch ultralytics paddleocr imageio-ffmpeg

# 4. Start the API
python -m uvicorn main:app --host 127.0.0.1 --port 8000

Open http://127.0.0.1:8000 in your browser.

⚠️ Before expecting the complete pipeline to run, read Known Issues / Setup Notes. The supplied archive contains an ANPR model-path mismatch and an evidence-snapshot path mismatch.

🎯 Platform at a Glance

Layer

Current implementation

🎥 Input

Project-local MP4 video

🧠 Detection

Ultralytics YOLO (yolo26n.pt)

🎯 Tracking

ByteTrack

🧍 Pose

YOLO pose (yolo11n-pose.pt)

🚧 Security logic

Virtual-fence intrusion detection

🕵️ Behavior

Loitering, rapid/erratic movement, hands raised, crouching

🚘 ANPR

Plate detector + PaddleOCR + temporal voting

📸 Evidence

JPEG snapshots + CSV

🗃️ Persistence

SQLite

🌐 API

FastAPI

🖥️ UI

Static HTML/CSS/JavaScript

🎬 Output

Annotated MP4 + browser-compatible H.264 MP4

📌 Overview

IBVAP processes CCTV video through a multi-stage computer-vision pipeline. The current application exposes that pipeline through a FastAPI service rather than requiring the operator to run the processing directly from a Streamlit interface.

The active API workflow is:

The frontend sends a virtual-fence polygon and camera/video information to the API.

FastAPI validates the request and starts a background worker thread.

backend/intrusion_susact.py performs object detection/tracking, pose analysis, virtual-fence intrusion detection, suspicious-activity analysis, event logging, snapshots, and annotated-video generation.

backend/anpr_numberplate.py receives the intrusion-annotated video and performs vehicle/plate detection and OCR.

The resulting AI video is converted to H.264/yuv420p with the FFmpeg executable supplied by imageio-ffmpeg for browser playback.

SQLite stores detection/intrusion/suspicious-activity event records.

The frontend consumes the API for statistics, events, and the processed MJPEG stream.

The supplied repository is primarily video-file based. The current API does not implement an RTSP/camera capture service or a multipart video-upload endpoint.

🎯 Objectives

Detect people and selected vehicle classes in CCTV footage.

Track detected objects using ByteTrack-backed Ultralytics tracking.

Define a polygonal restricted zone / virtual fence.

Detect objects/persons entering the restricted zone.

Analyze tracked people for rule-based suspicious behaviors.

Capture evidence snapshots and persist event metadata.

Detect vehicle license plates and recognize text using OCR.

Produce an annotated MP4 result suitable for browser playback.

Provide an HTTP API that the frontend can use to start processing and retrieve results.

Present operational statistics and recent events through a lightweight browser UI.

✨ Features

Implemented in the supplied code

Feature

Status

Implementation

FastAPI backend

✅ Active

main.py

Static web frontend

✅ Active

frontend/index.html, script.js, style.css

Person detection

✅ Active

Ultralytics YOLO model yolo26n.pt

Vehicle detection

✅ Active

Same YOLO model; configured classes include car, motorcycle, bus, truck

Object tracking

✅ Active

Ultralytics tracking with bytetrack.yaml

Pose estimation

✅ Active

yolo11n-pose.pt

Virtual fence

✅ Active

Polygon supplied to /api/detection/start

Intrusion events

✅ Active

intrusion_susact.py

Suspicious-activity analytics

✅ Active

Rule-based temporal movement + pose logic

Evidence snapshots

✅ Active

JPEG files under backend/logs/snapshots/

CSV event log

✅ Active

backend/logs/intrusion_log.csv

SQLite event database

✅ Active

database/ibvap.db

ANPR

✅ Active in end-to-end worker

backend/anpr_numberplate.py

Indian plate validation

✅ Implemented

Regex/state-code validation in ANPR module

OCR

✅ Active in ANPR

PaddleOCR PP-OCRv5_server_rec, CPU mode

Browser video conversion

✅ Active

imageio-ffmpeg + H.264/yuv420p

API MJPEG stream

✅ Active

/api/stream

Frontend statistics

✅ Active

/api/stats

Frontend event log

✅ Active

/api/events

Face recognition

⚠️ Standalone module

backend/face_reco.py; not imported by main.py or intrusion_susact.py

Night/low-light processing

⚠️ Standalone test

backend/night_detection_test.py; not wired into the API worker

Authentication

❌ Not implemented

No auth middleware/token/session system found

RTSP/live camera ingestion

❌ Not implemented

Current input is a local video file

Video upload API

❌ Not implemented

No multipart upload endpoint found

🏗️ System Architecture

flowchart TD
    U[Operator / Browser] --> FE[Static Frontend<br/>HTML + CSS + JavaScript]
    FE --> API[FastAPI API<br/>main.py]

    API --> STATE[In-memory Detection State]
    API --> WORKER[Background Thread]

    WORKER --> DET[Intrusion & Behavioral Pipeline<br/>backend/intrusion_susact.py]
    DET --> YOLO[YOLO Object Detection<br/>yolo26n.pt]
    DET --> BT[ByteTrack Tracking]
    DET --> POSE[YOLO11n Pose<br/>yolo11n-pose.pt]
    DET --> VF[Virtual Fence]
    DET --> BA[Rule-based Behavioral Analytics]
    DET --> DB[(SQLite<br/>database/ibvap.db)]
    DET --> CSV[CSV Log]
    DET --> SNAP[Evidence Snapshots]
    DET --> VID[Intrusion-annotated MP4]

    VID --> ANPR[ANPR Pipeline<br/>backend/anpr_numberplate.py]
    ANPR --> VEH[YOLO Vehicle/Object Detection]
    ANPR --> PLATE[Indian Plate Detector<br/>iitj_cv_bharat_plate.pt]
    ANPR --> OCR[PaddleOCR<br/>PP-OCRv5_server_rec]
    ANPR --> VID2[Final Annotated MP4]

    VID2 --> FFMPEG[imageio-ffmpeg<br/>H.264 / yuv420p]
    FFMPEG --> BROWSER[Browser-compatible MP4]

    API --> DB
    API --> STREAM[MJPEG / API Results]
    STREAM --> FE
    DB --> FE

Important architecture detail

The current API worker runs the intrusion/behavior pipeline first, then copies the generated intrusion video to a temporary ANPR input, runs ANPR, and writes the final ANPR-annotated result back to intrusion_result.mp4. The temporary ANPR input is deleted afterward. The final result is then converted to a browser-compatible H.264 MP4. This ordering is implemented directly in main.py.

🔄 System Workflow

sequenceDiagram
    participant B as Browser
    participant A as FastAPI
    participant W as Worker Thread
    participant D as Intrusion Pipeline
    participant N as ANPR
    participant F as FFmpeg
    participant DB as SQLite

    B->>A: POST /api/detection/start
    A->>A: Validate fence/video/model
    A-->>B: 200 + detection state
    A->>W: Start background thread
    W->>D: run_detection(video, fence, camera)
    D->>D: YOLO detection + ByteTrack
    D->>D: YOLO pose + virtual fence
    D->>D: Behavioral rules
    D->>DB: Log events
    D->>D: Save snapshots + CSV
    D-->>W: Annotated intrusion video + result
    W->>N: Process intrusion-annotated video
    N->>N: Vehicle/object detection
    N->>N: Plate detection + geometry filtering
    N->>N: Image enhancement + OCR
    N-->>W: Final annotated video
    W->>F: H.264/yuv420p conversion
    F-->>W: Browser-compatible MP4
    W-->>A: completed state
    B->>A: GET /api/stream
    A-->>B: Processed MJPEG frames
    B->>A: GET /api/events
    A->>DB: Read events
    DB-->>A: Event records
    A-->>B: JSON events

🧠 AI & Computer Vision Pipeline

1. Object detection

backend/intrusion_susact.py loads:

backend/yolo26n.pt

The active detection class IDs are:

Class ID

Category

Display name

0

person

HUMAN

2

car

CAR

3

motorcycle

BIKE

5

bus

BUS

7

truck

TRUCK

The model is invoked through Ultralytics YOLO tracking.

2. Object tracking

The pipeline calls Ultralytics tracking with:

tracker="bytetrack.yaml"

Tracked object IDs are subsequently associated with internal logical IDs. The implementation retains logical-object state for several frames to reduce identity fragmentation when an object temporarily disappears.

3. Pose estimation

The second model is:

backend/yolo11n-pose.pt

It supplies the COCO 17-keypoint human pose representation. Pose keypoints are matched to tracked person bounding boxes and are used by the intrusion and behavioral rules.

4. Virtual-fence intrusion detection

The API accepts a polygon containing 3 or 4 points. For people, the implementation uses pose keypoints when available to determine whether a human has entered the restricted polygon. The result is converted into an intrusion event and annotated on the output video.

5. Suspicious-activity analytics

The implementation is explicitly rule-based behavioral analytics, not a trained suspicious-behavior classifier.

The current rules include:

Loitering — approximately 6 seconds within a body-height-scaled area.

Rapid movement — normalized movement exceeding the configured threshold.

Erratic movement — repeated large changes in movement direction.

Hands raised — both wrists above their corresponding shoulders when pose confidence is adequate.

Crouching — compressed torso geometry based on shoulder/hip keypoints.

Suspicion is confirmed only after persistence across multiple frames. The source code itself describes these as indicators rather than proof of criminal intent.

6. Alerts and evidence

When an intrusion or confirmed suspicious activity occurs, the system can:

Save a JPEG snapshot.

Write an event to SQLite.

Append an event to the CSV log.

Add an annotation to the processed video.

Trigger a sound alert. On Windows, the implementation attempts to use winsound; on non-Windows systems it falls back to a terminal bell.

7. ANPR

The active API pipeline invokes backend/anpr_numberplate.py after intrusion processing.

The ANPR stages are approximately:

Annotated vehicle video
        ↓
YOLO object/vehicle detection
        ↓
License-plate detector
        ↓
Plate geometry filtering
        ↓
Plate crop / padding
        ↓
Image enhancement variants
        ↓
PaddleOCR text recognition
        ↓
OCR candidate collection
        ↓
Temporal voting / memory
        ↓
Indian registration validation
        ↓
Confirmed plate text + video annotation

The plate model is:

models/iitj_cv_bharat_plate.pt

The OCR configuration in the ANPR source uses:

PP-OCRv5_server_rec
engine: paddle
device: cpu

The ANPR implementation validates normal Indian registration formats and Bharat Series (BH) formats. It also explicitly avoids inventing a plate number when evidence is insufficient.

8. Face recognition — not part of the current API pipeline

backend/face_reco.py contains a separate FaceRecognizer implementation based on InsightFace buffalo_l. It can load reference images from a known_faces directory and compare normalized embeddings against a configurable similarity threshold.

However, the supplied main.py and intrusion_susact.py do not invoke FaceRecognizer. Therefore face recognition should not be presented as an active end-to-end API feature in the current release.

9. Night / low-light processing — experimental/standalone

backend/night_detection_test.py contains a CLAHE-based low-light enhancement experiment. It processes data/raw/night_vision_1.mp4 and writes a test output under a logs/night_test path.

The supplied API worker does not call this module and main.py does not expose a night-mode parameter. Therefore night vision should be described as experimental/standalone rather than an active API feature.

📂 Project Structure

The archive contains the following relevant structure:

IBVAP/
├── main.py                         # FastAPI application and orchestration
├── cctv.mp4                        # Current root-level input video
├── intrusion_result.mp4            # Generated/checked-in processed video
├── test_h264.mp4                   # Video/codec test artifact
├── test_mp4v.mp4                   # Video/codec test artifact
│
├── backend/
│   ├── anpr_numberplate.py         # ANPR + plate OCR pipeline
│   ├── intrusion_susact.py         # Detection, tracking, pose, intrusion, behavior
│   ├── face_reco.py                # Standalone InsightFace recognizer
│   ├── night_detection_test.py     # Standalone CLAHE/night experiment
│   ├── yolo26n.pt                  # Object detection model
│   ├── yolo11n-pose.pt             # Pose model
│   ├── cctv.mp4                    # Duplicate backend video artifact
│   ├── intrusion_result.mp4        # Backend output artifact
│   └── logs/
│       ├── intrusion_log.csv       # Generated CSV event log
│       └── snapshots/              # Generated evidence JPEGs
│
├── models/
│   └── iitj_cv_bharat_plate.pt     # License-plate detection model
│
├── database/
│   ├── db.py                       # SQLite initialization/read/write helpers
│   ├── schema.sql                  # Event table schema
│   ├── ibvap.db                    # SQLite database artifact
│   ├── test_db.py                  # Database test script
│   └── __init__.py
│
├── frontend/
│   ├── index.html                  # Main operator UI
│   ├── script.js                   # API calls and UI behavior
│   ├── style.css                   # UI styling
│   └── assets/                     # Logos and visual assets
│
├── data/
│   ├── README.md                   # Test dataset documentation
│   ├── output_detected.mp4         # Test/output artifact
│   ├── raw/                        # Source/test videos
│   ├── test/                       # Test video/results
│   └── test_setup/                 # Small OpenCV test utilities
│
└── known_faces/                    # Referenced by face_reco.py; no reference images
                                    # are present in the supplied archive.

Active vs test/legacy-looking files

The API's active entry point is main.py. The active processing modules it imports are backend/intrusion_susact.py and backend/anpr_numberplate.py.

face_reco.py, night_detection_test.py, the scripts under data/test_setup/, and database/test_db.py are auxiliary/experimental/test code and are not part of the main API execution path.

The archive also contains generated media, logs, database data, and Python bytecode. These should normally be removed from the source-control history before publishing a clean repository.

🛠️ Technologies Used

Layer

Technology

Evidence in code

API

FastAPI

main.py

ASGI server

Uvicorn required to serve FastAPI

No server launcher is embedded in main.py

Validation

Pydantic

DetectionRequest

HTTP responses

FastAPI FileResponse, StreamingResponse, JSONResponse

main.py

CORS

FastAPI CORS middleware

allow_origins=["*"]

Computer vision

OpenCV

Video I/O, drawing, JPEG encoding

Object detection/tracking

Ultralytics YOLO

YOLO(...), .track(...)

Tracking

ByteTrack

tracker="bytetrack.yaml"

Pose

YOLO11n-pose

yolo11n-pose.pt

Numerical processing

NumPy

Geometry/keypoint/video processing

ML runtime

PyTorch

Detection configuration and inference

ANPR OCR

PaddleOCR

TextRecognition

OCR runtime

PaddlePaddle

Required by PaddleOCR's Paddle engine

Face recognition module

InsightFace + ONNX Runtime

Standalone face_reco.py

Database

SQLite

database/db.py

Browser video conversion

imageio-ffmpeg

Retrieves an FFmpeg executable

Frontend

HTML/CSS/vanilla JavaScript

frontend/

There is no requirements.txt, pyproject.toml, Pipfile, Conda environment file, or package.json in the supplied archive.

⚙️ Prerequisites

Required for the current API pipeline

Python 3.x. The archive contains Python 3.12/3.13 bytecode artifacts, but the project does not declare a supported Python version.

A working installation of the Python packages listed in the installation section.

An environment capable of running the Ultralytics/PyTorch inference path.

The current intrusion pipeline explicitly calls YOLO with device=0 and half=True, so the supplied implementation is configured for GPU device 0. A CPU fallback is not implemented in that function.

Sufficient RAM/VRAM for the YOLO, pose, and ANPR workloads.

Windows is particularly relevant because the current sound-alert implementation uses winsound when available, although the code has a terminal-bell fallback elsewhere.

Browser

A modern browser such as Chrome or Edge is recommended. The API creates a second browser-compatible H.264/yuv420p output specifically for reliable browser playback.

🚀 Installation

Important: Because the supplied archive contains no dependency lockfile or requirements file, the commands below are a reconstruction from the imports and explicit installation messages in the source. They are installation guidance, not a claim that the original project was built from this exact lockfile.

Windows PowerShell

# Clone the repository
# git clone <YOUR-REPOSITORY-URL>
# cd IBVAP

# Create a virtual environment
py -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Upgrade packaging tools
python -m pip install --upgrade pip setuptools wheel

# Install core dependencies
python -m pip install fastapi uvicorn pydantic opencv-python numpy torch ultralytics imageio-ffmpeg

# Install PaddleOCR and its Paddle runtime
python -m pip install paddleocr paddlepaddle

# Optional: install face-recognition module dependencies
python -m pip install insightface onnxruntime

If PowerShell blocks activation, either adjust the local execution policy or use Command Prompt:

.venv\Scripts\activate.bat

Linux / macOS

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
python -m pip install fastapi uvicorn pydantic opencv-python numpy torch ultralytics imageio-ffmpeg
python -m pip install paddleocr paddlepaddle

# Optional standalone face-recognition module
python -m pip install insightface onnxruntime

PyTorch installation: GPU-enabled PyTorch installation can depend on the NVIDIA driver/CUDA environment. The source does not pin a CUDA or PyTorch version, so choose the PyTorch build appropriate for the target machine rather than copying an unverified CUDA command into this README.

🔧 Configuration

The current API configuration is largely hard-coded in Python.

API request configuration

DetectionRequest accepts:

{
  "fence_points": [[100,100], [500,100], [500,400], [100,400]],
  "camera_id": "CAM_01",
  "video": "cctv.mp4"
}

Constraints:

fence_points: 3–4 points.

camera_id: defaults to CAM_01.

video: defaults to cctv.mp4.

The video resolver restricts the selected file to a file directly under the project root and rejects path traversal. The current allowlist for direct video retrieval contains:

cctv.mp4
intrusion_result.mp4
intrusion_browser.mp4

Current important paths

Input video:             cctv.mp4
Object model:            backend/yolo26n.pt
Pose model:              backend/yolo11n-pose.pt
Plate model:             models/iitj_cv_bharat_plate.pt
AI output:               intrusion_result.mp4
Browser output:          intrusion_browser.mp4
Evidence:                backend/logs/snapshots/
CSV log:                 backend/logs/intrusion_log.csv
SQLite database:         database/ibvap.db

Feature switches

backend/intrusion_susact.py currently enables:

ENABLE_INTRUSION = True
ENABLE_SUSPICIOUS_ACTIVITY = True
ENABLE_SOUND_ALERTS = True
ENABLE_SKELETON = True
ENABLE_TRAIL = True

These are source-level switches rather than environment variables or API settings.

🤖 AI Models

Model

Location

Purpose

Active in API pipeline?

yolo26n.pt

backend/yolo26n.pt

Object detection + tracked objects

✅ Yes

yolo11n-pose.pt

backend/yolo11n-pose.pt

Human pose/keypoints

✅ Yes

iitj_cv_bharat_plate.pt

models/iitj_cv_bharat_plate.pt

License-plate detection

✅ Yes, through ANPR

PP-OCRv5_server_rec

Downloaded/managed by PaddleOCR

Plate text recognition

✅ Yes, CPU

buffalo_l

InsightFace-managed model

Face recognition

⚠️ Standalone only

The supplied repository already contains the three .pt files listed above. The PaddleOCR and InsightFace models may be downloaded/initialized by their respective libraries at runtime depending on the installed versions and local model cache.

Model setup check

Before starting the API, verify:

backend/yolo26n.pt
backend/yolo11n-pose.pt
models/iitj_cv_bharat_plate.pt

The /api/health endpoint reports whether the object model path exists, but the current health implementation does not independently validate every model used by the full pipeline.

▶️ Running the Project

1. Activate the environment

Windows:

.\.venv\Scripts\Activate.ps1

Linux/macOS:

source .venv/bin/activate

2. Start the API

main.py does not contain an if __name__ == "__main__" Uvicorn launcher. Run it with Uvicorn explicitly:

python -m uvicorn main:app --host 127.0.0.1 --port 8000

For local development with automatic reload:

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

The port is not hard-coded in the source. The commands above deliberately choose port 8000.

3. Open the application

http://127.0.0.1:8000/

FastAPI's generated documentation should also be available at:

http://127.0.0.1:8000/docs

and:

http://127.0.0.1:8000/redoc

4. Check service health

curl http://127.0.0.1:8000/api/health

Example shape:

{
  "api": "online",
  "ai_model": true,
  "database": true,
  "camera_source": true,
  "status": "idle"
}

🌐 API Documentation

The API is generated by FastAPI from main.py. The canonical interactive API documentation is exposed by FastAPI at /docs when the server is running.

No separate OpenAPI JSON file is committed in the supplied archive.

📡 API Endpoints

Endpoint summary

Method

Endpoint

Purpose

GET

/

Serve frontend index.html

GET

/api/health

API/model/database/video health status

GET

/api/stats

Aggregate dashboard statistics

GET

/api/events

Return all database events

GET

/api/events/latest

Return newest event or null

GET

/api/detection/status

Current detection state

POST

/api/detection/start

Start background AI processing

POST

/api/detection/reset

Reset completed/error/idle state

GET

/api/camera/frame

Return first frame of cctv.mp4 as JPEG

GET

/api/stream

MJPEG stream of processed frames/result

GET

/api/output-video

Return final browser-compatible MP4

GET

/api/video/{filename}

Return one of the allowlisted MP4 files

GET

/api/evidence/{filename}

Return one evidence JPEG

GET

/api/evidence?limit=N

Return evidence records with URLs

Start detection

curl -X POST http://127.0.0.1:8000/api/detection/start \
  -H "Content-Type: application/json" \
  -d '{
    "fence_points": [[100,100],[500,100],[500,400],[100,400]],
    "camera_id": "CAM_01",
    "video": "cctv.mp4"
  }'

The endpoint starts processing in a background thread and immediately returns a state response rather than waiting for the complete video to finish.

Typical initial response shape:

{
  "ok": true,
  "message": "AI detection started",
  "status": "starting",
  "camera_id": "CAM_01",
  "fence_points": [[100,100],[500,100],[500,400],[100,400]],
  "started_at": 0,
  "finished_at": null,
  "error": null,
  "frames_processed": 0,
  "intrusion_count": 0,
  "output_video": false
}

started_at is an actual timestamp at runtime; the 0 above is illustrative only.

Detection status

curl http://127.0.0.1:8000/api/detection/status

Reset

curl -X POST http://127.0.0.1:8000/api/detection/reset

Resetting while detection is starting or running returns HTTP 409.

Events

curl http://127.0.0.1:8000/api/events

The SQLite event rows contain:

{
  "id": 1,
  "timestamp": "2026-09-14T00:00:00",
  "camera_id": "CAM_01",
  "object_type": "person",
  "track_id": 1,
  "event_type": "intrusion",
  "confidence": 0.91,
  "snapshot_path": ".../intrusion_0001.jpg",
  "plate_number": null
}

Exact values depend on the processed video.

Statistics

curl http://127.0.0.1:8000/api/stats

The response includes:

active_camera
active_intrusions
ai_events
events_24h
ai_confidence
detection_status

Camera frame

curl http://127.0.0.1:8000/api/camera/frame --output first-frame.jpg

This endpoint always reads the first frame of the root-level cctv.mp4 configured by main.py.

Processed output video

curl http://127.0.0.1:8000/api/output-video --output intrusion_browser.mp4

The API returns the browser-compatible H.264/yuv420p version.

Evidence

curl "http://127.0.0.1:8000/api/evidence?limit=20"

Individual evidence images are available through:

GET /api/evidence/{filename}

The implementation also checks that the resolved evidence path remains inside the snapshot directory.

🖥️ Frontend

The frontend is deliberately lightweight: it is not a Node/React/Vue application.

It consists of:

frontend/index.html

frontend/style.css

frontend/script.js

frontend/assets/*

FastAPI serves the frontend itself. main.py mounts the frontend directory and serves index.html at /.

Frontend/API communication

The supplied JavaScript calls:

POST /api/detection/start
GET  /api/stats
GET  /api/events

The surveillance feed is an <img> whose source is:

/api/stream

The frontend therefore does not require a separate frontend development server.

Current UI behavior

The interface includes:

Surveillance feed area.

Event log.

Statistics such as active camera, intrusions, event count, and AI confidence.

System-status presentation.

Day/night visual theme switch.

IST clock.

Responsive/mobile navigation.

A playback/detection button that posts the currently hard-coded demo polygon and cctv.mp4 to /api/detection/start.

📊 Results & Output

Generated AI video

The primary processing pipeline writes:

intrusion_result.mp4

The API subsequently creates:

intrusion_browser.mp4

The latter is encoded with:

H.264
YUV420P
faststart MP4 flags
no audio

The conversion is performed by an FFmpeg executable obtained through imageio-ffmpeg.

Event records

SQLite records contain:

Field

Meaning

id

Auto-increment event ID

timestamp

Event timestamp

camera_id

Camera identifier

object_type

Detected object category

track_id

Tracking ID

event_type

Event category such as detection, intrusion, or suspicious activity

confidence

Detection/behavior confidence value stored by the producer

snapshot_path

Evidence image path

plate_number

Schema field reserved for plate number; current active ANPR flow does not write plate values into SQLite

Evidence

Intrusion and suspicious-activity events create JPEG snapshots under:

backend/logs/snapshots/

The API exposes those files through /api/evidence/{filename}.

CSV

The intrusion pipeline also writes:

backend/logs/intrusion_log.csv

The CSV contains fields for date/time, object ID, logical ID, category, event, behavior, confidence, centroid coordinates, and snapshot.

🗄️ Database

The project uses SQLite, not PostgreSQL/MySQL/MongoDB.

The database helper is:

 database/db.py

The active table is:

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

database/schema.sql contains the same basic schema.

The API initializes the database when event data is read through its database helper, while the intrusion pipeline explicitly initializes it before processing.

Important ANPR/database distinction

Although the schema contains plate_number, the supplied backend/anpr_numberplate.py does not call database.db.log_event() and does not update that field. ANPR currently produces confirmed plate information in its processing output/overlay, but the end-to-end API's SQLite records should not be described as containing automatically persisted ANPR plate numbers unless that integration is added.

🔒 Security & Privacy

Implemented protections

The video resolver rejects path traversal and requires the resolved input video to remain directly under the project root.

The evidence endpoint similarly verifies that an evidence file resolves inside the snapshot directory.

The API rejects a second detection request while a previous detection is running.

Reset is rejected while processing is active.

Not implemented

The supplied code does not implement:

User authentication.

API keys.

JWT/session authentication.

Role-based access control.

HTTPS/TLS configuration.

Rate limiting.

Audit authentication.

Per-user access restrictions.

CORS is currently configured broadly:

allow_origins=["*"]
allow_credentials=False
allow_methods=["*"]
allow_headers=["*"]

This is convenient for development but should be tightened before exposing the service beyond a trusted environment.

Because the platform can process surveillance footage, operators should treat video, face images, license plates, snapshots, and event metadata as potentially sensitive information and deploy the system according to applicable organizational and legal requirements.

🧪 Testing

The archive contains small test utilities rather than a complete automated test suite.

Python syntax/import compilation

From the project root:

python -m py_compile main.py backend/intrusion_susact.py backend/anpr_numberplate.py backend/face_reco.py database/db.py

Database test

The supplied database/test_db.py uses imports such as from db import ..., so run it from the database directory:

cd database
python test_db.py
cd ..

This test inserts example rows into the SQLite database. Run it against a disposable/test database if you do not want to alter your real event history.

Video test utilities

The archive includes:

data/test_setup/video_test.py
data/test_setup/play_video.py
data/test_setup/intrusion_test.py

These are standalone OpenCV utilities and are not API integration tests.

Current test limitation

No pytest configuration, CI workflow, dependency lockfile, or comprehensive API integration test suite is included in the supplied archive.

⚠️ Known Issues / Setup Notes

No dependency file is included. There is no requirements.txt, pyproject.toml, Pipfile, or environment specification. Reproducible dependency installation should be added before the repository is treated as production-ready.

GPU device is hard-coded in the intrusion pipeline. backend/intrusion_susact.py calls both detection and pose inference with device=0; it also enables half=True for tracking. The current API pipeline therefore assumes an available GPU device 0. A configurable CPU fallback is not present.

The API port is not defined by the source. main.py creates the FastAPI application but does not launch Uvicorn itself. The README uses 8000 explicitly in the startup command.

The input is file-based. /api/detection/start resolves a project-root video filename. There is no upload endpoint and no RTSP/camera acquisition implementation.

The frontend uses a fixed demo fence. frontend/script.js currently sends four hard-coded points and video: "cctv.mp4". There is no frontend polygon-drawing workflow implemented in the supplied JavaScript.

Face recognition is disconnected from the active pipeline. face_reco.py exists and is functional-looking, but it is not called by main.py or intrusion_susact.py.

Night detection is disconnected from the API pipeline. night_detection_test.py contains CLAHE processing but is a standalone test script and imports detector, which is not present in the supplied archive. It should not be treated as a current API feature.

ANPR is CPU OCR. The source explicitly configures PaddleOCR text recognition with OCR_DEVICE = "cpu". This can become a processing bottleneck for long videos.

ANPR does not persist plate numbers into SQLite. The database schema has a plate_number column, but the supplied ANPR module does not update it.

Generated files are mixed with source code. The archive contains many large MP4 files, hundreds of snapshots, CSV logs, a populated SQLite database, model binaries, and bytecode. These are not appropriate as normal source-control files in most Git workflows.

Duplicate video/model/output artifacts exist. For example, there are root/backend copies of some videos and multiple test outputs. The active API paths should be the authoritative source for future repository cleanup.

backend/_init_.py is misspelled. The conventional package file is __init__.py. Python namespace-package behavior may still allow imports in some environments, but this filename is not the standard package initializer.

The archive contains Python bytecode for multiple Python versions. __pycache__ contains .pyc files for Python 3.12 and 3.13. These should not be committed.

No authentication is present. The current API should be considered a trusted-network/development service rather than a hardened public service.

The database path is local SQLite. It is suitable for the supplied single-process architecture but is not a replacement for a production multi-worker/event-store architecture.

Multiple Uvicorn workers should not be assumed safe. Detection state is held in process memory and the worker is a Python thread. Running multiple API worker processes would create separate states and can lead to inconsistent processing/output behavior.

The active pipeline uses show_window=False but still performs the full OpenCV processing loop. This is appropriate for the API worker, while the original detection function also retains a desktop/OpenCV preview path when called with show_window=True.

🐛 Troubleshooting

YOLO model yolo26n.pt is missing

Verify:

backend/yolo26n.pt

exists relative to main.py.

Pose model missing

The API health endpoint checks only the primary YOLO model. The actual detection pipeline also needs:

backend/yolo11n-pose.pt

Plate model missing

ANPR requires:

models/iitj_cv_bharat_plate.pt

Browser video is not produced

Check that imageio-ffmpeg is installed:

python -m pip install imageio-ffmpeg

The worker invokes FFmpeg to create intrusion_browser.mp4.

Detection fails immediately on a machine without a GPU

The current intrusion_susact.py uses:

 device=0
 half=True

A CPU fallback is not implemented in the supplied active pipeline. This requires a code/configuration change before the API can reliably support CPU-only execution.

API starts but frontend statistics are empty

Check:

curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/events
curl http://127.0.0.1:8000/api/stats

Then check the Uvicorn terminal for pipeline/database errors.

/api/output-video returns 404

The endpoint requires the processed browser-compatible video to exist. Start detection and wait until the detection state becomes completed.

Detection is already running

A second /api/detection/start request returns HTTP 409 while the existing worker is starting or running. Poll:

GET /api/detection/status

Face recognition says no known faces are loaded

face_reco.py expects image files under:

known_faces/

The supplied archive contains no reference face images. Also note that this module is not connected to the active API pipeline.

📈 Future Improvements

The following are planned/recommended improvements, not claims about the current implementation:

Add a pinned requirements.txt or pyproject.toml and lock compatible versions.

Make device selection configurable (cuda, cpu, etc.) rather than hard-coding GPU device 0.

Add real camera/RTSP input support.

Add multipart video-upload support with safe temporary storage.

Implement frontend virtual-fence drawing and coordinate validation against the actual video dimensions.

Integrate face recognition into the tracked-person pipeline only where legally and operationally appropriate.

Integrate low-light detection/CLAHE as a configurable preprocessing stage.

Persist confirmed ANPR plate numbers and their confidence/evidence metadata in the database.

Add structured ANPR API results instead of relying primarily on annotated video output.

Add authentication, authorization, TLS, rate limiting, and audit logging.

Replace process-local detection state with a job/task system if concurrent or distributed processing is required.

Separate generated media/log storage from source code.

Add automated API, database, CV-pipeline, and regression tests.

Add CI for linting, type checking, tests, and dependency/security checks.

Add model/version metadata to results for reproducibility.

Add configurable thresholds through environment variables or a validated configuration file.

Add retention policies for snapshots, videos, and event records.

Add observability/metrics for processing FPS, latency, failed jobs, OCR confidence, and model failures.

👥 Contributors

Replace these placeholders with the final team information:

Name

Role

GitHub / Profile

<Team Member 1>

<Role>

<Profile URL>

<Team Member 2>

<Role>

<Profile URL>

<Team Member 3>

<Role>

<Profile URL>

<Team Member 4>

<Role>

<Profile URL>

The supplied frontend currently contains links for a six-person team and a GitHub repository, but those links should be verified before treating them as the canonical contributor list for the repository.

📜 License

No license file is included in the supplied project archive.

Before publishing the repository as an open-source project, add a license appropriate to the project and to the licenses/terms of the datasets, pretrained models, and third-party libraries used by IBVAP.

Until a license is added, do not describe the repository as being available under a specific open-source license.

⚠️ Disclaimer

IBVAP is a research/prototype video-analysis platform. Its computer-vision outputs are probabilistic and should not be treated as definitive evidence of identity, intent, criminal activity, or security status.

In particular:

A detection is not proof that an object or person has been correctly classified.

Suspicious-activity labels are rule-based behavioral indicators, not determinations of criminal intent.

ANPR/OCR can produce false positives or false negatives, especially with blur, occlusion, poor lighting, camera motion, unusual plate formats, or low-resolution footage.

Face recognition, if enabled in a future integration, can have additional accuracy, privacy, bias, and legal considerations.

Operators should independently review alerts and evidence before taking consequential action.

Deployment should comply with applicable surveillance, privacy, data-protection, and organizational policies.

The platform should therefore be treated as AI-assisted decision support, with human review remaining responsible for operational decisions.

🧹 Recommended Repository Hygiene

Before the first public GitHub push, remove generated/runtime artifacts from the repository and retain only source, configuration, documentation, required small assets, and models that you have decided to distribute.

A recommended .gitignore is provided below.

Suggested initial repository workflow

# From the project root

# 1. Create a clean Python environment
python -m venv .venv

# 2. Activate it and install dependencies
# Windows PowerShell:
# .\.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# 3. Verify the Python sources compile
python -m py_compile main.py backend/intrusion_susact.py backend/anpr_numberplate.py backend/face_reco.py database/db.py

# 4. Inspect the files that will be committed
 git status
 git diff --cached

# 5. Add source files
 git add .

# 6. Review staged files carefully before committing
 git status

# 7. Commit
 git commit -m "Document IBVAP API architecture"

# 8. Push after verifying the repository contents
 git push origin main

Do not run git add . blindly if large media, databases, logs, or private surveillance data are still present in the working tree.

📋 Quick Start for a New Developer

# Clone
 git clone <YOUR-REPOSITORY-URL>
 cd IBVAP

# Create environment
 python -m venv .venv

# Activate
 # Windows PowerShell:
 # .\.venv\Scripts\Activate.ps1
 # Linux/macOS:
 # source .venv/bin/activate

# Install dependencies
 python -m pip install --upgrade pip setuptools wheel
 python -m pip install fastapi uvicorn pydantic opencv-python numpy torch ultralytics imageio-ffmpeg
 python -m pip install paddleocr paddlepaddle

# Verify required models exist
 # backend/yolo26n.pt
 # backend/yolo11n-pose.pt
 # models/iitj_cv_bharat_plate.pt

# Start API
 python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Open browser
 # http://127.0.0.1:8000/

Then use the UI's VIEW PLAYBACK action or call the API directly with a valid 3–4 point fence polygon.

🔎 Current Implementation at a Glance

                 IBVAP CURRENT IMPLEMENTATION

 Browser
   │
   ▼
 FastAPI (main.py)
   │
   ├── /api/health
   ├── /api/stats
   ├── /api/events
   ├── /api/detection/start
   ├── /api/detection/status
   ├── /api/detection/reset
   ├── /api/camera/frame
   ├── /api/stream
   ├── /api/output-video
   └── /api/evidence/*
             │
             ▼
       Background thread
             │
             ▼
 backend/intrusion_susact.py
             │
       ┌─────┼───────────┐
       ▼     ▼           ▼
     YOLO  ByteTrack   YOLO Pose
       │     │           │
       └─────┼───────────┘
             ▼
      Virtual Fence
             +
   Behavioral Analytics
             │
       ┌─────┼───────┐
       ▼     ▼       ▼
     SQLite  CSV   Snapshots
             │
             ▼
     intrusion_result.mp4
             │
             ▼
 backend/anpr_numberplate.py
             │
       Plate detector + OCR
             │
             ▼
     final annotated MP4
             │
             ▼
      imageio-ffmpeg
             │
             ▼
     intrusion_browser.mp4

IBVAP — Intelligent Border Video Analysis Platform
AI-assisted video analysis with human-reviewed operational intelligence.

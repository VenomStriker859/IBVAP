# IBVAP – Intelligent Border Video Analysis Platform

<p align="center">
  <b>AI-Powered Video Surveillance and Analysis Platform</b>
</p>

<p align="center">
  Intelligent video analysis for object detection, tracking, intrusion detection,
  ANPR, face recognition, and threat monitoring.
</p>

---

## 📌 Overview

**IBVAP (Intelligent Battlefield Video Analysis Platform)** is an AI-powered
video surveillance and analysis system designed to convert raw CCTV and
surveillance footage into meaningful and actionable information.

The platform uses computer vision, deep learning, video processing, and
REST APIs to analyze live or recorded video. It can detect and track objects,
identify suspicious activities, detect intrusions, perform Automatic Number
Plate Recognition (ANPR), and support face recognition.

Unlike a Streamlit-based application, IBVAP follows an **API-based architecture**.
The AI processing modules are exposed through backend APIs, allowing them to
be consumed by a web frontend or other applications.

The goal of IBVAP is to reduce the need for continuous manual monitoring and
provide faster, structured, and automated analysis of surveillance footage.

---

## 🚀 Key Features

### 🎥 Video Processing
- Upload and process surveillance videos.
- Process CCTV footage frame-by-frame.
- Generate analyzed/result videos.
- Support integration with live camera feeds.

### 🎯 Object Detection
- AI-based object detection using YOLO models.
- Detect relevant objects in surveillance footage.
- Display bounding boxes and detection information.

### 🔄 Object Tracking
- Track detected objects across video frames.
- Maintain object identities during movement.
- Provide movement information for detected objects.

### 🚨 Intrusion Detection
- Detect unauthorized movement into monitored areas.
- Identify suspicious activity.
- Generate alerts for detected intrusion events.

### 🚗 ANPR – Automatic Number Plate Recognition
- Detect vehicle number plates.
- Extract number plate information.
- Process vehicle-related surveillance footage.

### 👤 Face Recognition
- Detect faces from surveillance footage.
- Compare detected faces with configured known faces.
- Provide recognition information when a match is available.

### 🌙 Night/Low-Light Detection
- Analyze surveillance footage captured under low-light conditions.
- Support specialized detection for night-time surveillance.

### 📊 Event Analysis
- Identify important events from processed footage.
- Record detection information.
- Generate structured analysis results.

### 🌐 API-Based Architecture
- REST API-based backend.
- Frontend can communicate with the AI engine through APIs.
- Modular architecture for adding new AI capabilities.
- Easier integration with external applications and dashboards.

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     User / Operator │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Web Frontend     │
                    │   User Interface    │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │    IBVAP Backend    │
                    │     API Server      │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌────────────┐    ┌────────────┐    ┌────────────┐
      │   Object   │    │ Intrusion  │    │    ANPR    │
      │ Detection  │    │ Detection  │    │            │
      └────────────┘    └────────────┘    └────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    AI / CV Engine   │
                    │ YOLO + Processing   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Results / Database  │
                    │ Videos / Events     │
                    └─────────────────────┘

# PodLens (CiteCast) 🎙️🔍
> **Real-Time Context Lens & Grounded In-Stream Fact-Checker for Podcasts**  
> *Built for the Google Cloud AI Builder Cup — Media, Content & Digital Experiences Track*

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Vertex%20AI-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Model](https://img.shields.io/badge/Model-Gemini%201.5%20Flash-34A853)](https://deepmind.google/technologies/gemini/)
[![Grounding](https://img.shields.io/badge/Grounding-Google%20Search%20Tool-FBBC05)](https://cloud.google.com/vertex-ai/docs/generative-ai/grounding)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

---

## 💡 The Problem
Long-form video podcasts (science interviews, historical deep-dives, economic debates) are the world's most consumed educational medium, yet they are fraught with unverified claims, cited studies that do not generalize to humans, and misrepresented statistics. Listeners are left to either accept questionable statements at face value or manually pause to search academic databases on their own.

## 🚀 The Solution
**PodLens** acts as an intelligent, heads-up verification layer synchronized to live and recorded podcast streams. Using **Gemini 1.5 Flash** and native **Google Search Grounding**, PodLens extracts factual assertions, validates them against current scientific consensus and primary literature, and projects interactive, timestamped citation cards directly into a companion sidebar or browser overlay.

---

## 🛠️ Architecture Overview

```
+------------------+      +-------------------+      +--------------------------+
|  Media Ingestion | ---> | Cloud Pub/Sub     | ---> | Cloud Run (Worker Engine)|
|  (YouTube/Audio) |      | (30s Audio Chunks)|      | Gemini 1.5 + Grounding   |
+------------------+      +-------------------+      +--------------------------+
                                                                   |
                                                                   v
+------------------+      +-------------------+      +--------------------------+
|  Web Player UI / | <--- | WebSockets / SSE  | <--- | Cloud Firestore          |
|  Chrome Overlay  |      | Realtime Sync Bus |      | Timecoded Claim Store    |
+------------------+      +-------------------+      +--------------------------+
```
*Detailed breakdown available in [`docs/architecture.md`](docs/architecture.md).*

---

## ⚡ Key Features
- **Sub-2s Real-Time Claim Extraction:** Differentiates between casual conversational banter and verifiable factual claims using Gemini 1.5 Flash.
- **Search-Grounded Evidence Cards:** Every claim is categorized (`VERIFIED`, `CONTESTED`, `FALSE/UNSUPPORTED`) with primary citations (DOIs, research institutions, official records).
- **Temporal Video Sync:** Synchronizes with YouTube player `currentTime`, dynamically surfacing context cards right when the speaker utters the assertion.
- **Post-Episode Intelligence Dossier:** Generates an end-of-episode breakdown summarizing credibility ratio and citation exports (Markdown/Zotero).

---

## 📦 Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud Project with Vertex AI and Firestore APIs enabled
- `gcloud` CLI authenticated (`gcloud auth application-default login`)

### 1. Clone & Set Environment
```bash
git clone https://github.com/your-org/podlens.git
cd podlens
cp .env.example .env
```

### 2. Run Backend Worker
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Run Frontend Web Player
```bash
cd ../frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` to start analyzing streams.

### 4. Deploy Prototype to Google Cloud Run (1-Command)
```bash
# Setup GCP APIs & IAM
./deploy/setup_gcp.sh YOUR_PROJECT_ID us-central1

# Build and Deploy to Cloud Run
./deploy/deploy_cloud_run.sh YOUR_PROJECT_ID us-central1
```

---

## 📚 Project Documentation
- [System Architecture](docs/system_architecture.md)
- [User Journey & Experience](docs/user_journey_experience.md)
- [Google Cloud Console Deployment Guide](docs/gcp_console_deployment_guide.md)
- [Prompt Engineering & Schemas](docs/prompt_engineering_schemas.md)
- [API & WebSocket Specification](docs/api_websocket_specification.md)
- [Hackathon Demo Runbook](docs/hackathon_demo_runbook.md)
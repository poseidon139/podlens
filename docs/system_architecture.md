# PodLens (CiteCast) System Architecture

## 1. Overview
PodLens is a real-time, multimodal podcast companion and fact-checking engine built on Google Cloud. It streams video or audio podcasts, identifies verifiable statements (scientific claims, historical facts, statistics, and citations), checks them against grounded sources using Vertex AI and Google Search Grounding, and synchronizes contextual verification cards with the user's playback timeline.

---

## 2. High-Level Architecture Diagram

```
+----------------------------------------------------------------------------------------+
|                                    1. Ingestion Layer                                  |
|                                                                                        |
|  [YouTube Stream / Local MP4/MP3]                                                      |
|           |                                                                            |
|           +---> Cloud Storage (Raw Staging Bucket)                                     |
|           |                                                                            |
|           +---> Media Chunking Worker (FFmpeg / PyAV)                                  |
|                    | (30-second audio/video buffers)                                   |
|                    v                                                                   |
|              Cloud Pub/Sub (Topic: stream-chunks)                                      |
+----------------------------------------------------------------------------------------+
                                       |
                                       v
+----------------------------------------------------------------------------------------+
|                             2. Intelligence & Processing                               |
|                                                                                        |
|  Cloud Run Worker Service (Subscriber)                                                 |
|    |                                                                                   |
|    +--> Step A: Transcription & Claim Extraction                                       |
|    |    - Engine: Vertex AI Gemini 1.5 Flash                                           |
|    |    - Input: Base64 audio/video chunk + timestamp offset                           |
|    |    - Task: Extract assertions, speakers, and context hints                        |
|    |                                                                                   |
|    +--> Step B: Fact Verification & Context Grounding                                  |
|    |    - Engine: Vertex AI Gemini 1.5 Flash + Google Search Grounding Tool            |
|    |    - Fallback: Cloud Vector Search (AlloyDB / pgvector for cached claim graphs)   |
|    |    - Task: Synthesize verdict (Verified / Contested / Unverified / False),        |
|    |            1-sentence explainer, and reference DOI/URLs                           |
+----------------------------------------------------------------------------------------+
                                       |
                                       v
+----------------------------------------------------------------------------------------+
|                               3. Data & Sync Layer                                     |
|                                                                                        |
|  Google Cloud Firestore (Document Store)                                               |
|    - Collection: `podcasts/{podcast_id}/claims/{claim_id}`                             |
|    - Real-time snapshot listener triggered by client playback timestamp               |
|                                                                                        |
|  Cloud Storage                                                                         |
|    - Archived claims, transcripts, and cached summaries                                |
+----------------------------------------------------------------------------------------+
                                       |
                                       v
+----------------------------------------------------------------------------------------+
|                                4. Client / Delivery Layer                              |
|                                                                                        |
|  Web UI (Next.js / Tailwind CSS) or Chrome Extension Overlay                           |
|    - Interactive Video/Audio Player (HTML5 / YouTube IFrame API)                       |
|    - Synchronized Sidebar / Heads-Up Display (HUD)                                     |
|    - Verdict badges (Green: Verified, Amber: Debated, Red: False/Misleading)           |
|    - Direct paper citations, source links, and sample size cards                       |
+----------------------------------------------------------------------------------------+
```

---

## 3. Component Breakdown

### 3.1 Ingestion Service
* **Role:** Accepts YouTube links or direct media file uploads.
* **Technology:** Python, FFmpeg, Cloud Run, Cloud Storage.
* **Mechanics:** 
  * Extracts audio tracks at 16kHz mono.
  * Slices media into overlapping chunks (30s duration, 5s overlap) to prevent claims that cross window boundaries from being cut off.
  * Dispatches chunk payloads with metadata (`chunk_index`, `start_ms`, `end_ms`) to Cloud Pub/Sub.

### 3.2 Intelligence Pipeline (Cloud Run & Vertex AI)
* **Stage 1: Claim Extraction Engine**
  * Model: `gemini-1.5-flash-001`
  * System Instruction: Parses input transcripts or audio chunks to filter conversational filler and identify only factual assertions (empirical metrics, scientific research references, economic figures, historical claims).
* **Stage 2: Grounding & Verification Engine**
  * Uses Vertex AI Grounding with Google Search.
  * Evaluates consensus, opposing views, and original documentation.
  * Formats response into a deterministic JSON schema.

### 3.3 Data Layer (Firestore)
* Stores claims mapped by timecodes.
* Schema:
```json
{
  "id": "claim_849201",
  "podcast_id": "lex_fridman_ep412",
  "timestamp_start": 324.5,
  "timestamp_end": 348.0,
  "speaker": "Guest",
  "verbatim_quote": "A study showed fasting for 72 hours resets the entire immune system.",
  "status": "CONTESTED",
  "badge_color": "amber",
  "summary": "Stem cell regeneration occurs in mice models, but clinical human trials show mixed, non-definitive results.",
  "citations": [
    {
      "source_title": "Cell Stem Cell (2014) Study",
      "url": "https://doi.org/10.1016/j.stem.2014.04.014",
      "type": "Peer-Reviewed Paper"
    }
  ]
}
```

### 3.4 Presentation Layer
* **Video Synchronization:** Hooks into the player's `timeupdate` event.
* **Card Rendering:** Queries Firestore with a query window: `timestamp_start <= currentTime <= timestamp_end + buffer`.
* **State Management:** Keeps historical claims listed chronologically in a collapsible feed so users can review previous citations at any point.

---

## 4. Key Security & Operational Considerations
* **Rate Limiting & Cost Control:** Use Gemini 1.5 Flash for extraction and verification passes to minimize latency (<1.5s per chunk) and token expenditure.
* **Cache Layer:** Implement Redis (Memorystore) using claim text embeddings to prevent re-querying common claims across different episodes.
* **Data Integrity:** Strict JSON Schema validation enforced via Gemini `response_mime_type="application/json"`.
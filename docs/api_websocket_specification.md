# PodLens API & Sync Protocol Specification

## Base URL
- Local: `http://localhost:8000`
- Production: `https://api.podlens.app`

---

## 1. REST Endpoints

### 1.1 Ingest Media Stream / Video URL
Initiates ingestion, chunking, and worker evaluation for a podcast.

* **Endpoint:** `POST /api/v1/sessions`
* **Request Body:**
```json
{
  "source_type": "YOUTUBE",
  "media_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "options": {
    "auto_ground": true,
    "chunk_duration_sec": 30
  }
}
```
* **Response (202 Accepted):**
```json
{
  "session_id": "sess_8923fd0a",
  "status": "PROCESSING",
  "stream_ws_url": "ws://localhost:8000/ws/sessions/sess_8923fd0a",
  "estimated_chunks": 120
}
```

---

### 1.2 Fetch Episode Claim Dossier
Returns all analyzed and verified claim objects for an entire session.

* **Endpoint:** `GET /api/v1/sessions/{session_id}/claims`
* **Query Parameters:**
  * `min_status` (optional): `VERIFIED` | `CONTESTED` | `UNSUPPORTED`
* **Response (200 OK):**
```json
{
  "session_id": "sess_8923fd0a",
  "total_claims": 14,
  "metrics": {
    "verified": 10,
    "contested": 3,
    "unsupported": 1
  },
  "claims": [
    {
      "claim_id": "clm_01",
      "timestamp_start": 45.2,
      "timestamp_end": 58.0,
      "speaker": "Host",
      "claim_text": "Coffee consumption reduces all-cause mortality risk by roughly 12 percent.",
      "status": "VERIFIED",
      "badge_color": "green",
      "verdict_summary": "Large prospective cohort studies associate moderate coffee intake (2-4 cups/day) with an 8-15% reduction in mortality risk.",
      "citations": [
        {
          "title": "Annals of Internal Medicine (2022) Cohort Study",
          "source": "American College of Physicians",
          "url": "https://doi.org/10.7326/M21-2977"
        }
      ]
    }
  ]
}
```

---

## 2. Real-Time WebSocket Protocol

### 2.1 Connection
Connect client player to session event bus:
`ws://localhost:8000/ws/sessions/{session_id}`

### 2.2 Client Inbound Messages
Send current playback head position to synchronize cards:
```json
{
  "type": "PLAYBACK_TICK",
  "current_time_sec": 46.5
}
```

### 2.3 Server Outbound Events

#### Active Claim Trigger
Broadcasted when playback time hits a claim window:
```json
{
  "event": "CLAIM_ACTIVE",
  "data": {
    "claim_id": "clm_01",
    "timestamp_start": 45.2,
    "timestamp_end": 58.0,
    "status": "VERIFIED",
    "badge_color": "green",
    "claim_text": "Coffee consumption reduces all-cause mortality risk by roughly 12 percent.",
    "verdict_summary": "Large cohort studies associate moderate coffee intake with an 8-15% reduction in mortality.",
    "citations": [
      {
        "title": "Annals of Internal Medicine (2022)",
        "url": "https://doi.org/10.7326/M21-2977"
      }
    ]
  }
}
```

#### Claim Dismiss
Broadcasted when playback moves beyond the active claim duration:
```json
{
  "event": "CLAIM_IDLE",
  "data": {
    "last_active_id": "clm_01"
  }
}
```
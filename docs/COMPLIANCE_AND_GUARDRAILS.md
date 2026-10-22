# PodLens Compliance, Safety & Guardrails Architecture

**Team:** Team Dronger  
**Platform:** Google Cloud Platform (Cloud Run, Vertex AI Gemini 1.5 Flash, Vertex AI Search Grounding, Cloud Firestore, Cloud Logging, Cloud Monitoring)  
**Version:** 1.2.0  
**Last Updated:** October 2026

---

## Executive Summary

PodLens is an assistive real-time fact-checking and contextual grounding engine for streaming spoken audio and video podcasts. This document details the compliance, safety guardrails, governance policies, and observability telemetry enforced across the PodLens infrastructure in accordance with the Google Cloud Acceptable Use Policy (AUP), the Google Cloud Agentic AI Responsible Use Guidelines, and the Google Cloud Platform Service Specific Terms (Sections 14, 15, 19, and 20).

---

## 1. Application & Prompt Engineering Guardrails

### 1.1 Safety Threshold Matrix
PodLens configures explicit safety settings directly on Vertex AI Gemini API calls to enforce zero-tolerance thresholds against abusive, harmful, or dangerous generation:

| Harm Category | Block Threshold | Enforcement Action |
|---|---|---|
| `HARM_CATEGORY_HATE_SPEECH` | `BLOCK_LOW_AND_ABOVE` | Pipeline aborts inference, emits structured audit log `SAFETY_BLOCK_TRIGGERED`, and returns safe `UNVERIFIED` verdict. |
| `HARM_CATEGORY_HARASSMENT` | `BLOCK_LOW_AND_ABOVE` | Blocked immediately with safety notification; no offensive content displayed or cached. |
| `HARM_CATEGORY_SEXUALLY_EXPLICIT` | `BLOCK_LOW_AND_ABOVE` | Blocked immediately; output suppressed. |
| `HARM_CATEGORY_DANGEROUS_CONTENT` | `BLOCK_LOW_AND_ABOVE` | Intercepted before output generation to prevent medical or physical harm. |

When any response has `candidate.finish_reason == "SAFETY"`, the backend traps the safety block gracefully without crashing, logs the event to Cloud Logging, and returns an unverified placeholder with a responsible AI notification.

### 1.2 Grounding Confidence Cutoff Thresholds
Vertex AI Search Grounding outputs web/literature citations along with grounded confidence scores ($0.0 \le c \le 1.0$). To prevent misleading false-positive assertions:

- **Verified ($\ge 0.75$):** High confidence; multiple peer-reviewed or authoritative primary sources directly validate the claim.
- **Contested ($0.60 \le c < 0.75$):** Moderate confidence; literature shows conflicting evidence, narrow study populations, or preliminary animal models.
- **Unverified / Low Context ($< 0.60$ or 0 citations):** Sub-threshold confidence or missing empirical data automatically defaults to `ClaimStatus.UNVERIFIED` with `BadgeColor.GRAY`. The engine never hallucinates an authoritative conclusion when grounding sources are ambiguous.

### 1.3 Input Sanitization & Anti-Injection Guardrails
All text segments and media URLs ingested from users or WebSocket audio streams pass through `backend/app/services/sanitizer.py`:
- **Prompt Injection Defense:** Strips adversarial prompt break-outs (e.g., `SYSTEM:`, `IGNORE PREVIOUS INSTRUCTIONS`, `ASSISTANT:`, markdown injection delimiters).
- **Length Caps:** Enforces strict 1,500 character limits on transcript chunks to prevent denial-of-wallet / token exhaustion attacks.
- **SSRF & Private Network Defense:** Validates video/audio URLs using `validate_media_url()`. Rejects `localhost`, `127.0.0.1`, RFC1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and Cloud Metadata endpoints (`169.254.169.254`).

---

## 2. Cloud Run Infrastructure & Security

### 2.1 Scoped Least-Privilege IAM Roles
PodLens operates under a dedicated runtime service account (`podlens-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com`). The service account has zero administrative permissions and is constrained strictly to four operational roles:

1. `roles/aiplatform.user`: Grants invocation rights for Vertex AI Gemini models and Search Grounding APIs.
2. `roles/datastore.user`: Grants read/write access to Cloud Firestore for session metadata, synchronized claims, and user feedback audits.
3. `roles/logging.logWriter`: Allows writing structured audit logs to Cloud Logging.
4. `roles/monitoring.metricWriter`: Enables emission of custom telemetry and latency metrics.

### 2.2 Environment Isolation
- **Staging:** Runs isolated Cloud Run revisions (`--set-env-vars ENVIRONMENT=staging,DEMO_MODE=true`) where prompt modifications, safety filters, and grounding cutoffs are regression-tested.
- **Production:** Requires verified container builds, strict rate limits (`ENVIRONMENT=production,DEMO_MODE=false`), and alerts enabled.

### 2.3 Rate Limiting & Timeout Guardrails
FastAPI middleware (`security_guardrails_middleware`) in `backend/app/main.py` enforces:
- **General Endpoints:** 60 requests per minute per IP.
- **Heavy AI Operations:** 15 requests per minute per IP for `/claims/verify` and segment analysis.
- **Request Timeout:** 45-second execution limit prevents hung HTTP connections.
- **Security Headers:** Enforces `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN`.

---

## 3. Observability & Audit Telemetry

### 3.1 Structured Cloud Logging Schema
All security, grounding, and claim verification events emit single-line JSON to standard output matching the Google Cloud Logging format:

```json
{
  "severity": "INFO",
  "message": "Claim grounded successfully: Fasting stimulates autophagy",
  "logging.googleapis.com/trace": "projects/podlens-511817/traces/abc123xyz",
  "audit": {
    "event_type": "CLAIM_GROUNDED",
    "session_id": "huberman_fasting",
    "claim_id": "claim_001",
    "status": "VERIFIED",
    "confidence_score": 0.88,
    "citation_count": 3
  }
}
```

Audit Event Types:
- `CLAIM_GROUNDED`: Successful verification and literature retrieval.
- `CLAIM_UNVERIFIED_LOW_CONFIDENCE`: Grounding score dropped below threshold; status assigned to `UNVERIFIED`.
- `SAFETY_BLOCK_TRIGGERED`: Vertex AI safety filter intervened.
- `PROMPT_INJECTION_DETECTED`: Ingestion sanitizer neutralized adversarial tokens.
- `CLAIM_FEEDBACK_RECORDED`: User submitted agreement, dispute, or correction.

### 3.2 Human-in-the-Loop Feedback Mechanism
Every claim card in the PodLens UI contains an interactive dispute/agreement mechanism:
- Users can flag verdicts as **Accurate**, **Contested**, **Factually Inaccurate**, or **Safety / Policy Concern**.
- Feedback is stored in Firestore under `/sessions/{session_id}/claims/{claim_id}/feedback/{feedback_id}`.
- Allows continuous auditing and evaluation against false positives.

### 3.3 Cloud Monitoring Alerting Policies
Declarative alert policies are defined in `deploy/cloud_monitoring_alert_policy.yaml`:
- **5xx Errors:** Fires if Cloud Run 5xx response rate exceeds 5% over 5 minutes.
- **p95 Latency:** Fires if p95 latency exceeds 5,000ms.
- **Safety Blocks:** Fires immediately upon any `SAFETY_BLOCK_TRIGGERED` audit event.
- **Rate Limit Spikes:** Fires if HTTP 429 responses spike above 10 per 3 minutes.

---

## 4. Governance & Policy Alignment

### 4.1 Google Cloud Platform Service Specific Terms Alignment
PodLens architecture complies explicitly with the key sections of the GCP Service Specific Terms:

1. **Section 14 & 15 (Operational Responsibility & Disclaimers):** PodLens functions strictly as an assistive tool for educational and research context. AI-generated consensus statements are presented alongside primary literature citations, leaving operational decision-making to the user.
2. **Section 19 (Generative AI Additional Terms):** PodLens does not use customer input data or stream transcripts to train foundation models. Assistive disclaimers are visibly displayed in the UI and exported dossiers.
3. **Section 20 (Vertex AI Search Grounding):** All citations generated by Search Grounding retain full source attribution (PubMed, Cochrane, NCBI, PubMed Central) with direct outbound hyperlinks.

### 4.2 Prompt Versioning Catalog
Model prompts are version-controlled and maintained in `backend/app/services/vertex_ai_service.py`:

- **Active Version:** `v1.2` (October 2026)
  - Features: Topic domain context awareness, 4-tier status classification (`VERIFIED`, `CONTESTED`, `UNSUPPORTED`, `UNVERIFIED`), strict JSON schema output, confidence score calibration.
- **Previous Version:** `v1.1` (September 2026)
  - Features: 3-tier status classification, legacy text parsing.

---

## 5. Verification & Testing Checklist

- [x] Vertex AI safety thresholds set to `BLOCK_LOW_AND_ABOVE`.
- [x] Confidence threshold cutoffs enforced ($< 0.60 \rightarrow \text{UNVERIFIED}$, $\ge 0.75 \rightarrow \text{VERIFIED}$).
- [x] Input sanitizer neutralizing prompt injections and blocking SSRF metadata URLs.
- [x] Least-privilege IAM script configured (`deploy/setup_least_privilege_iam.sh`).
- [x] Cloud Monitoring alert policy drafted (`deploy/cloud_monitoring_alert_policy.yaml`).
- [x] Structured Cloud Logging emitting valid JSON with trace propagation.
- [x] User feedback mechanism wired end-to-end (UI $\rightarrow$ API $\rightarrow$ Firestore).
- [x] Frontend builds cleanly with zero errors.

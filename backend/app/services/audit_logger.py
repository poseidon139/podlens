import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("podlens.audit")

class StructuredAuditLogger:
    """
    Emits Google Cloud Logging compliant structured JSON records for audit telemetry,
    verdict traceability, grounding confidence tracking, and safety compliance.
    """

    def __init__(self, service_name: str = "podlens-engine"):
        self.service_name = service_name

    def log_event(
        self,
        event_type: str,
        message: str,
        severity: str = "INFO",
        trace_id: Optional[str] = None,
        audit_data: Optional[Dict[str, Any]] = None,
    ):
        record = {
            "severity": severity.upper(),
            "time": datetime.now(timezone.utc).isoformat(),
            "message": f"[{event_type}] {message}",
            "serviceContext": {"service": self.service_name},
            "audit": {
                "event_type": event_type,
                **(audit_data or {})
            }
        }
        if trace_id:
            record["logging.googleapis.com/trace"] = trace_id

        # Write as single-line JSON to stdout for Cloud Run log ingestion
        try:
            line = json.dumps(record, default=str)
            sys.stdout.write(line + "\n")
            sys.stdout.flush()
        except Exception as e:
            logger.error(f"Failed to serialize audit log record: {e}")

    def log_grounding_eval(
        self,
        session_id: str,
        claim_id: str,
        claim_text: str,
        status: str,
        confidence_score: float,
        citations_count: int,
        sources: list,
        latency_ms: Optional[float] = None,
        is_fallback: bool = False
    ):
        severity = "INFO"
        event_type = "CLAIM_GROUNDED"
        if status == "UNVERIFIED" or is_fallback:
            severity = "WARNING"
            event_type = "CLAIM_UNVERIFIED_FALLBACK" if is_fallback else "CLAIM_UNVERIFIED_LOW_CONFIDENCE"

        self.log_event(
            event_type=event_type,
            message=f"Claim {claim_id} evaluated with status {status} (confidence={confidence_score:.2f}, citations={citations_count})",
            severity=severity,
            audit_data={
                "session_id": session_id,
                "claim_id": claim_id,
                "claim_snippet": claim_text[:120] if claim_text else "",
                "status": status,
                "confidence_score": confidence_score,
                "citations_count": citations_count,
                "sources": sources[:5],
                "latency_ms": latency_ms,
                "is_fallback": is_fallback
            }
        )

    def log_safety_block(
        self,
        session_id: str,
        prompt_snippet: str,
        reason: str,
        ratings: Optional[Dict[str, Any]] = None
    ):
        self.log_event(
            event_type="SAFETY_BLOCK_TRIGGERED",
            message=f"Gemini API returned safety block for session {session_id}: {reason}",
            severity="WARNING",
            audit_data={
                "session_id": session_id,
                "prompt_snippet": prompt_snippet[:150] if prompt_snippet else "",
                "block_reason": reason,
                "safety_ratings": ratings or {}
            }
        )

    def log_prompt_injection(
        self,
        input_type: str,
        snippet: str,
        client_ip: Optional[str] = None
    ):
        self.log_event(
            event_type="PROMPT_INJECTION_DETECTED",
            message=f"Defanged prompt injection in {input_type}",
            severity="WARNING",
            audit_data={
                "input_type": input_type,
                "snippet": snippet[:100] if snippet else "",
                "client_ip": client_ip or "unknown"
            }
        )

    def log_user_feedback(
        self,
        session_id: str,
        claim_id: str,
        feedback_type: str,
        helpful: bool,
        notes: Optional[str] = None,
        client_ip: Optional[str] = None
    ):
        self.log_event(
            event_type="CLAIM_FEEDBACK_RECORDED",
            message=f"User feedback submitted for claim {claim_id}: {feedback_type} (helpful={helpful})",
            severity="INFO",
            audit_data={
                "session_id": session_id,
                "claim_id": claim_id,
                "feedback_type": feedback_type,
                "helpful": helpful,
                "notes_snippet": notes[:100] if notes else "",
                "client_ip": client_ip or "unknown"
            }
        )

audit_logger = StructuredAuditLogger()

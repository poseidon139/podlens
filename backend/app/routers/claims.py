import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Request
from typing import List, Optional
from ..models.schemas import Claim, VerifyTextRequest, ExtractedClaim, ClaimCategory, ClaimFeedback, ClaimFeedbackRequest
from ..services.firestore_service import firestore_service
from ..services.vertex_ai_service import vertex_ai_service
from ..services.sanitizer import sanitize_text, detect_prompt_injection
from ..services.audit_logger import audit_logger

router = APIRouter(prefix="/sessions/{session_id}/claims", tags=["Claims"])

@router.get("", response_model=List[Claim])
def get_claims(
    session_id: str,
    min_status: Optional[str] = Query(None, description="Filter by status: VERIFIED, CONTESTED, UNSUPPORTED, UNVERIFIED")
):
    """
    Get all timestamped fact-checking claims for a podcast session
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return firestore_service.get_claims(session_id, min_status=min_status)

@router.post("/verify", response_model=Claim)
def verify_custom_claim(session_id: str, req: VerifyTextRequest, request: Request):
    """
    On-demand live verification of an arbitrary spoken claim or statement using Vertex AI + Google Search Grounding.
    Applies input sanitization, injection detection, and rate limits.
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    client_ip = request.client.host if request.client else "unknown"
    if detect_prompt_injection(req.text):
        audit_logger.log_prompt_injection("verify_custom_claim", req.text[:100], client_ip=client_ip)

    clean_text = sanitize_text(req.text, max_length=500)
    clean_speaker = sanitize_text(req.speaker or "Speaker", max_length=100)

    claim_id = f"clm_live_{uuid.uuid4().hex[:6]}"
    extracted = ExtractedClaim(
        claim_text=clean_text,
        speaker=clean_speaker,
        category=ClaimCategory.SCIENCE_HEALTH,
        start_offset_seconds=req.timestamp_start or 0.0,
        end_offset_seconds=req.timestamp_end or 30.0,
        search_query=f"{clean_text[:60]} study evidence consensus"
    )

    grounded_claim = vertex_ai_service.ground_and_verify_claim(extracted, session_id, claim_id, context=session.context)
    firestore_service.save_claim(grounded_claim)
    return grounded_claim

@router.post("/analyze_segment", response_model=Optional[Claim])
def analyze_speech_segment(session_id: str, timestamp: float = Query(..., description="Playback timestamp to analyze in seconds")):
    """
    On-demand analysis of speech when user seeks to a timestamp with no evaluated claims
    """
    from ..services.ingestion_service import ingestion_service
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    claim = ingestion_service.analyze_segment_at_time(session_id, timestamp)
    return claim

@router.post("/{claim_id}/feedback", response_model=ClaimFeedback)
def submit_claim_feedback(
    session_id: str,
    claim_id: str,
    req: ClaimFeedbackRequest,
    request: Request
):
    """
    User feedback mechanism: Allows users to flag incorrect, contested, or unverified verdicts.
    Provides human-in-the-loop audit telemetry adhering to Google Cloud Agentic AI guidelines.
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    client_ip = request.client.host if request.client else "unknown"
    clean_notes = sanitize_text(req.user_notes or "", max_length=1000) if req.user_notes else None
    clean_source = sanitize_text(req.suggested_source or "", max_length=300) if req.suggested_source else None

    feedback_id = f"fb_{uuid.uuid4().hex[:8]}"
    feedback = ClaimFeedback(
        feedback_id=feedback_id,
        claim_id=claim_id,
        session_id=session_id,
        helpful=req.helpful,
        feedback_type=req.feedback_type,
        user_notes=clean_notes,
        suggested_source=clean_source,
        client_ip=client_ip,
        created_at=datetime.now(timezone.utc).isoformat()
    )

    firestore_service.save_feedback(feedback)
    audit_logger.log_user_feedback(
        session_id=session_id,
        claim_id=claim_id,
        feedback_type=req.feedback_type,
        helpful=req.helpful,
        notes=clean_notes,
        client_ip=client_ip
    )
    return feedback

@router.get("/{claim_id}/feedback", response_model=List[ClaimFeedback])
def get_claim_feedback(session_id: str, claim_id: str):
    """
    Retrieve audit feedback history for a specific claim
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return firestore_service.get_claim_feedback(claim_id)


import uuid
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.schemas import Claim, VerifyTextRequest, ExtractedClaim, ClaimCategory
from ..services.firestore_service import firestore_service
from ..services.vertex_ai_service import vertex_ai_service

router = APIRouter(prefix="/sessions/{session_id}/claims", tags=["Claims"])

@router.get("", response_model=List[Claim])
def get_claims(
    session_id: str,
    min_status: Optional[str] = Query(None, description="Filter by status: VERIFIED, CONTESTED, UNSUPPORTED")
):
    """
    Get all timestamped fact-checking claims for a podcast session
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return firestore_service.get_claims(session_id, min_status=min_status)

@router.post("/verify", response_model=Claim)
def verify_custom_claim(session_id: str, req: VerifyTextRequest):
    """
    On-demand live verification of an arbitrary spoken claim or statement using Vertex AI + Google Search Grounding
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    claim_id = f"clm_live_{uuid.uuid4().hex[:6]}"
    extracted = ExtractedClaim(
        claim_text=req.text,
        speaker=req.speaker or "Speaker",
        category=ClaimCategory.SCIENCE_HEALTH,
        start_offset_seconds=req.timestamp_start or 0.0,
        end_offset_seconds=req.timestamp_end or 30.0,
        search_query=f"{req.text} study evidence consensus"
    )

    grounded_claim = vertex_ai_service.ground_and_verify_claim(extracted, session_id, claim_id)
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


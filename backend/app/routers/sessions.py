from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Literal
from ..models.schemas import Session, IngestSessionRequest, TranscriptLine
from ..services.firestore_service import firestore_service
from ..services.ingestion_service import ingestion_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("", response_model=Session, status_code=201)
def create_session(request: IngestSessionRequest):
    """
    Ingest a new podcast stream (YouTube URL, direct audio, or pre-loaded sample).
    Applies input sanitization, SSRF guardrails, and validation.
    """
    try:
        session = ingestion_service.create_session(request)
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

@router.get("", response_model=List[Session])
def list_sessions():
    """
    List all active or pre-loaded podcast sessions
    """
    return firestore_service.list_sessions()

@router.get("/{session_id}", response_model=Session)
def get_session(session_id: str):
    """
    Get detailed information, status, and credibility metrics for a session
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/{session_id}/dossier/export")
def export_dossier(session_id: str, format: Literal["markdown", "json"] = "markdown"):
    """
    Export the post-episode truth & credibility dossier in Markdown or JSON
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if format == "markdown":
        content = firestore_service.export_dossier_markdown(session_id)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=podlens_dossier_{session_id}.md"}
        )
    else:
        claims = firestore_service.get_claims(session_id)
        return {
            "session": session.model_dump(),
            "claims": [c.model_dump() for c in claims]
        }

@router.get("/{session_id}/transcript", response_model=List[TranscriptLine])
def get_session_transcript(session_id: str):
    """
    Get synchronized speech transcript lines mapped with real-time fact-checking statuses
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return ingestion_service.get_session_transcript_lines(session_id)

@router.delete("/{session_id}", status_code=200)
def delete_session(session_id: str):
    """
    Delete a session and all its associated claims
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Also clean up in-memory transcript cache
    ingestion_service.clear_session_data(session_id)
    
    success = firestore_service.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete session")
    return {"status": "deleted", "session_id": session_id}



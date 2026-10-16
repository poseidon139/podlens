from fastapi import APIRouter, HTTPException, Query, Response
from typing import List
from ..models.schemas import Session, IngestSessionRequest
from ..services.firestore_service import firestore_service
from ..services.ingestion_service import ingestion_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("", response_model=Session, status_code=201)
def create_session(request: IngestSessionRequest):
    """
    Ingest a new podcast stream (YouTube URL, direct audio, or pre-loaded sample)
    """
    session = ingestion_service.create_session(request)
    return session

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
def export_dossier(session_id: str, format: str = Query("markdown", enum=["markdown", "json"])):
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

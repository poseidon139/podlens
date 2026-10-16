import re
import uuid
import logging
from typing import Optional, List, Dict
from datetime import datetime, timezone
from ..models.schemas import Session, IngestSessionRequest, DossierMetrics
from .firestore_service import firestore_service
from .vertex_ai_service import vertex_ai_service
from ..data.sample_episodes import SAMPLE_EPISODES

logger = logging.getLogger("podlens.ingestion")

def extract_youtube_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL patterns"""
    if not url:
        return None
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/|v\/|youtu\.be\/)([0-9A-Za-z_-]{11})',
        r'^([0-9A-Za-z_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def fetch_youtube_captions(video_id: str, max_duration_sec: float = 300.0) -> List[Dict]:
    """Fetch real transcripts/captions from YouTube if available"""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        # Support fetch on both instance and class depending on library version
        api = YouTubeTranscriptApi()
        if hasattr(api, "fetch"):
            transcript_list = api.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
        else:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
        
        snippets = []
        for item in transcript_list:
            start = getattr(item, 'start', None) if not isinstance(item, dict) else item.get('start', 0)
            text = getattr(item, 'text', '') if not isinstance(item, dict) else item.get('text', '')
            dur = getattr(item, 'duration', 0) if not isinstance(item, dict) else item.get('duration', 0)
            if start is not None and start <= max_duration_sec:
                snippets.append({"start": float(start), "text": str(text), "duration": float(dur)})
        return snippets
    except Exception as e:
        logger.info(f"Could not fetch YouTube captions for {video_id}: {e}")
        return []

class IngestionService:
    def create_session(self, req: IngestSessionRequest) -> Session:
        # Check if pre-configured sample ID was explicitly requested
        if req.source_type == "SAMPLE" and req.sample_id and req.sample_id in SAMPLE_EPISODES:
            return SAMPLE_EPISODES[req.sample_id]

        vid_id = extract_youtube_video_id(req.media_url or "")
        
        # If user explicitly picks a sample URL, return that sample
        if req.source_type == "SAMPLE":
            for s in SAMPLE_EPISODES.values():
                if s.youtube_video_id and s.youtube_video_id == vid_id:
                    return s

        # For any new ingestion, create a fresh unique session
        session_id = f"sess_{uuid.uuid4().hex[:8]}"
        title = req.title or (f"YouTube Stream ({vid_id})" if vid_id else "Live Podcast Stream")
        
        session = Session(
            session_id=session_id,
            title=title,
            source_type=req.source_type,
            media_url=req.media_url,
            youtube_video_id=vid_id or "9tRohh0gErM",
            duration_seconds=300.0,
            status="PROCESSING",
            stream_ws_url=f"/ws/sessions/{session_id}",
            total_claims=0,
            metrics=DossierMetrics(
                verified=0,
                contested=0,
                unsupported=0,
                total_claims=0,
                truth_score=0.0
            ),
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
        # Save clean session with 0 claims
        firestore_service.save_session(session)

        # Process real audio/transcript for this specific video
        if vid_id:
            self._process_video_stream(session, vid_id)
        else:
            session.status = "READY"
            firestore_service.save_session(session)

        return session

    def _process_video_stream(self, session: Session, video_id: str):
        """Fetch real captions for the video and extract empirical claims"""
        snippets = fetch_youtube_captions(video_id, max_duration_sec=300.0)
        
        if snippets:
            # Combine snippets into 45-second chunks for claim extraction
            chunks = []
            current_chunk_text = []
            chunk_start = snippets[0]["start"]
            chunk_end = chunk_start
            
            for snip in snippets:
                current_chunk_text.append(snip["text"])
                chunk_end = snip["start"] + snip.get("duration", 2.0)
                if chunk_end - chunk_start >= 45.0:
                    chunks.append({
                        "text": " ".join(current_chunk_text),
                        "start": chunk_start,
                        "duration": chunk_end - chunk_start
                    })
                    current_chunk_text = []
                    chunk_start = chunk_end
            
            if current_chunk_text:
                chunks.append({
                    "text": " ".join(current_chunk_text),
                    "start": chunk_start,
                    "duration": max(15.0, chunk_end - chunk_start)
                })

            # Extract claims from first 3 chunks
            claim_index = 1
            for chunk in chunks[:4]:
                extracted_list = vertex_ai_service.extract_claims(
                    chunk["text"],
                    base_offset=chunk["start"],
                    chunk_duration=chunk["duration"]
                )
                for ext in extracted_list:
                    claim_id = f"clm_{session.session_id}_{claim_index}"
                    grounded_claim = vertex_ai_service.ground_and_verify_claim(ext, session.session_id, claim_id)
                    firestore_service.save_claim(grounded_claim)
                    claim_index += 1

            session.status = "READY"
            firestore_service.save_session(session)
        else:
            # No automatic captions found for this video.
            # Keep claims clean and mark session READY so the user can verify statements on-demand.
            logger.info(f"No auto-captions available for {video_id}. Initializing clean session.")
            session.status = "READY"
            firestore_service.save_session(session)

ingestion_service = IngestionService()

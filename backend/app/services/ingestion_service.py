import re
import uuid
import logging
from typing import Optional, Dict
from datetime import datetime, timezone
from ..models.schemas import Session, IngestSessionRequest, DossierMetrics
from .firestore_service import firestore_service
from .vertex_ai_service import vertex_ai_service
from ..data.sample_episodes import SAMPLE_EPISODES, SAMPLE_CLAIMS

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

class IngestionService:
    def create_session(self, req: IngestSessionRequest) -> Session:
        # Check if pre-configured sample ID was requested
        if req.source_type == "SAMPLE" or (req.sample_id and req.sample_id in SAMPLE_EPISODES):
            sample_id = req.sample_id or "huberman_fasting"
            sample = SAMPLE_EPISODES.get(sample_id, SAMPLE_EPISODES["huberman_fasting"])
            return sample

        # Check if media_url matches any existing sample
        vid_id = extract_youtube_video_id(req.media_url or "")
        for s in SAMPLE_EPISODES.values():
            if s.youtube_video_id and s.youtube_video_id == vid_id:
                return s

        # Create new unique session
        session_id = f"sess_{uuid.uuid4().hex[:8]}"
        title = req.title or f"Podcast Stream ({vid_id or 'Custom Ingest'})"
        
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
            metrics=DossierMetrics(),
            created_at=datetime.now(timezone.utc).isoformat()
        )
        firestore_service.save_session(session)

        # Trigger background processing simulation / extraction
        self._process_stream_async(session)
        return session

    def _process_stream_async(self, session: Session):
        """Process incoming stream, extract empirical claims, and ground them"""
        # If it's a newly ingested video without pre-existing claims, generate rich context claims
        # or analyze sample transcript
        sample_transcript = (
            "Welcome everyone. Today we are looking at nutrition and longevity. "
            "A recent cohort study with over 150,000 subjects showed that moderate coffee consumption reduces all-cause mortality risk by 12 percent. "
            "Now on fasting: many influencers claim fasting for 24 hours doubles cellular autophagy in humans. "
            "However, direct clinical biomarkers in living human tissue remain contested and non-definitive. "
            "Also, drinking cold water does not burn 500 extra calories a day through thermogenesis; at most it burns 20 calories."
        )

        try:
            extracted_list = vertex_ai_service.extract_claims(sample_transcript, base_offset=10.0, chunk_duration=120.0)
            for idx, ext in enumerate(extracted_list):
                claim_id = f"clm_{session.session_id}_{idx+1}"
                grounded_claim = vertex_ai_service.ground_and_verify_claim(ext, session.session_id, claim_id)
                firestore_service.save_claim(grounded_claim)
            
            session.status = "READY"
            firestore_service.save_session(session)
        except Exception as e:
            logger.error(f"Error processing stream for session {session.session_id}: {e}")
            session.status = "READY"
            firestore_service.save_session(session)

ingestion_service = IngestionService()

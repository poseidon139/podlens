import re
import uuid
import logging
from typing import Optional, List, Dict
from datetime import datetime, timezone
from ..models.schemas import Session, IngestSessionRequest, DossierMetrics, Claim
from .firestore_service import firestore_service
from .vertex_ai_service import vertex_ai_service
from ..data.sample_episodes import SAMPLE_EPISODES

logger = logging.getLogger("podlens.ingestion")

# In-memory storage for full video captions
SESSION_TRANSCRIPTS: Dict[str, List[Dict]] = {}

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

def fetch_youtube_captions(video_id: str, max_duration_sec: float = 7200.0) -> List[Dict]:
    """Fetch real transcripts/captions from YouTube if available across up to 2 hours"""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
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
        title = req.title or (f"Podcast Stream ({vid_id})" if vid_id else "Live Podcast Stream")
        
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
        """Fetch real captions across the whole video and extract claims across the timeline"""
        snippets = fetch_youtube_captions(video_id, max_duration_sec=7200.0)
        
        if snippets:
            SESSION_TRANSCRIPTS[session.session_id] = snippets
            
            # Update real duration if captions span longer
            last_timestamp = snippets[-1]["start"] + snippets[-1].get("duration", 5.0)
            if last_timestamp > session.duration_seconds:
                session.duration_seconds = round(last_timestamp, 1)

            # Combine snippets into 45-second chunks
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

            # Select chunks distributed evenly across the video duration so timeline has claims throughout!
            selected_chunks = []
            total_chunks = len(chunks)
            if total_chunks <= 6:
                selected_chunks = chunks
            else:
                # Distribute 6 chunks from beginning, middle, and later parts of the video
                indices = [0, 1, total_chunks // 4, total_chunks // 2, (3 * total_chunks) // 4, total_chunks - 1]
                seen = set()
                for idx in indices:
                    if idx not in seen and idx < total_chunks:
                        seen.add(idx)
                        selected_chunks.append(chunks[idx])

            claim_index = 1
            for chunk in selected_chunks:
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
            logger.info(f"No auto-captions available for {video_id}. Initializing clean session.")
            session.status = "READY"
            firestore_service.save_session(session)

    def analyze_segment_at_time(self, session_id: str, timestamp_sec: float) -> Optional[Claim]:
        """
        On-demand fact-checking when user seeks to a timestamp that has no active claim.
        Extracts speech from the transcript at that time window and grounds it live!
        """
        snippets = SESSION_TRANSCRIPTS.get(session_id, [])
        if not snippets:
            # Fallback check if it's one of sample sessions
            for sid, claims in SAMPLE_EPISODES.items():
                if sid == session_id:
                    # Return nearest claim
                    pass

        # Find snippets around timestamp: [timestamp - 15, timestamp + 30]
        window_start = max(0, timestamp_sec - 15.0)
        window_end = timestamp_sec + 30.0

        target_snippets = [s for s in snippets if window_start <= s["start"] <= window_end]
        if not target_snippets:
            # If no exact snippets, try nearest within 45s
            target_snippets = [s for s in snippets if abs(s["start"] - timestamp_sec) <= 45.0]

        if not target_snippets:
            return None

        segment_text = " ".join(s["text"] for s in target_snippets)
        seg_start = target_snippets[0]["start"]
        seg_dur = max(15.0, target_snippets[-1]["start"] + target_snippets[-1].get("duration", 2.0) - seg_start)

        extracted_list = vertex_ai_service.extract_claims(segment_text, base_offset=seg_start, chunk_duration=seg_dur)
        if not extracted_list:
            # Fallback to create a verifiable assertion from the segment text itself
            from ..models.schemas import ExtractedClaim, ClaimCategory
            first_sentence = segment_text.split(".")[0].strip()
            if len(first_sentence) > 10:
                extracted_list = [ExtractedClaim(
                    claim_text=first_sentence,
                    speaker="Speaker",
                    category=ClaimCategory.SCIENCE_HEALTH,
                    start_offset_seconds=seg_start,
                    end_offset_seconds=seg_start + seg_dur,
                    search_query=f"{first_sentence} consensus study"
                )]

        if extracted_list:
            ext = extracted_list[0]
            claim_id = f"clm_seek_{uuid.uuid4().hex[:6]}"
            grounded = vertex_ai_service.ground_and_verify_claim(ext, session_id, claim_id)
            firestore_service.save_claim(grounded)
            return grounded

        return None

ingestion_service = IngestionService()

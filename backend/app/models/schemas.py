from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ClaimStatus(str, Enum):
    VERIFIED = "VERIFIED"
    CONTESTED = "CONTESTED"
    UNSUPPORTED = "UNSUPPORTED"

class BadgeColor(str, Enum):
    GREEN = "green"
    AMBER = "amber"
    RED = "red"

class ClaimCategory(str, Enum):
    SCIENCE_HEALTH = "SCIENCE_HEALTH"
    STATISTICS_DATA = "STATISTICS_DATA"
    HISTORY_POLITICS = "HISTORY_POLITICS"
    TECH_BUSINESS = "TECH_BUSINESS"

class Citation(BaseModel):
    title: str = Field(..., description="Title of the paper, study, or official data report")
    source: str = Field(..., description="Publication institution, journal, or source body")
    url: str = Field(..., description="Canonical DOI, academic URL, or source link")
    type: Optional[str] = Field("Peer-Reviewed Source", description="Type of citation")

class ExtractedClaim(BaseModel):
    claim_text: str = Field(..., description="Concise extracted factual assertion")
    speaker: Optional[str] = Field("Speaker", description="Identified speaker")
    category: ClaimCategory = Field(ClaimCategory.SCIENCE_HEALTH)
    start_offset_seconds: float = Field(..., description="Start timestamp in seconds")
    end_offset_seconds: float = Field(..., description="End timestamp in seconds")
    search_query: str = Field(..., description="Neutral search query for Google Search Grounding")

class Claim(BaseModel):
    id: str = Field(..., description="Unique claim identifier")
    session_id: str = Field(..., description="Associated session or podcast episode ID")
    timestamp_start: float = Field(..., description="Timecode start in seconds")
    timestamp_end: float = Field(..., description="Timecode end in seconds")
    speaker: str = Field("Speaker", description="Attributed speaker")
    claim_text: str = Field(..., description="Verbatim statement or factual assertion")
    category: ClaimCategory = Field(ClaimCategory.SCIENCE_HEALTH)
    status: ClaimStatus = Field(ClaimStatus.VERIFIED)
    badge_color: BadgeColor = Field(BadgeColor.GREEN)
    verdict_summary: str = Field(..., description="One to two sentence plain-language consensus summary")
    citations: List[Citation] = Field(default_factory=list)
    confidence_score: Optional[float] = Field(0.95, description="Model confidence score")
    search_query: Optional[str] = None
    created_at: Optional[str] = None

class DossierMetrics(BaseModel):
    verified: int = 0
    contested: int = 0
    unsupported: int = 0
    total_claims: int = 0
    truth_score: float = Field(100.0, description="Percentage of verified vs total claims")

class Session(BaseModel):
    session_id: str
    title: str
    source_type: str  # YOUTUBE, SAMPLE, AUDIO_UPLOAD
    media_url: Optional[str] = None
    youtube_video_id: Optional[str] = None
    duration_seconds: float = 0.0
    status: str = "READY"  # READY, PROCESSING, COMPLETED
    stream_ws_url: Optional[str] = None
    total_claims: int = 0
    metrics: DossierMetrics = Field(default_factory=DossierMetrics)
    created_at: Optional[str] = None

class IngestSessionRequest(BaseModel):
    source_type: str = Field("YOUTUBE", description="YOUTUBE, SAMPLE, or UPLOAD")
    media_url: Optional[str] = Field(None, description="YouTube URL or audio link")
    sample_id: Optional[str] = Field(None, description="Pre-loaded episode sample ID")
    title: Optional[str] = Field(None, description="Optional custom title")
    options: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"auto_ground": True, "chunk_duration_sec": 30})

class VerifyTextRequest(BaseModel):
    text: str = Field(..., description="Podcast speech or claim text to verify")
    speaker: Optional[str] = "Speaker"
    timestamp_start: Optional[float] = 0.0
    timestamp_end: Optional[float] = 30.0

class PlaybackTickMessage(BaseModel):
    type: str = "PLAYBACK_TICK"
    current_time_sec: float

class TranscriptLine(BaseModel):
    id: str
    start: float
    duration: float
    end: float
    text: str
    speaker: str = "Speaker"
    status: str = "VERIFIED"
    badge_color: str = "green"
    claim_id: Optional[str] = None
    verdict_summary: Optional[str] = None


import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone
from ..config import settings
from ..models.schemas import Session, Claim, DossierMetrics, ClaimStatus
from ..data.sample_episodes import SAMPLE_EPISODES, SAMPLE_CLAIMS

logger = logging.getLogger("podlens.firestore")

class FirestoreService:
    def __init__(self):
        self.db = None
        self._in_memory_sessions: Dict[str, Session] = {}
        self._in_memory_claims: Dict[str, List[Claim]] = {}
        self._init_firestore()
        self._load_seed_data()

    def _init_firestore(self):
        """Initialize Google Cloud Firestore client if credentials/project are available"""
        if settings.GCP_PROJECT_ID:
            try:
                from google.cloud import firestore
                self.db = firestore.Client(
                    project=settings.GCP_PROJECT_ID,
                    database=settings.FIRESTORE_DATABASE
                )
                logger.info(f"Connected to Cloud Firestore in project '{settings.GCP_PROJECT_ID}' (db: {settings.FIRESTORE_DATABASE})")
            except Exception as e:
                logger.warning(f"Could not connect to Cloud Firestore: {e}. Using fast in-memory store.")
                self.db = None
        else:
            logger.info("No GCP_PROJECT_ID provided. Using fast in-memory store.")
            self.db = None

    def _load_seed_data(self):
        """Seed pre-grounded episodes for immediate zero-config demo experience"""
        for sid, sess in SAMPLE_EPISODES.items():
            self._in_memory_sessions[sid] = sess
        for sid, claims in SAMPLE_CLAIMS.items():
            self._in_memory_claims[sid] = list(claims)

        # If connected to live Firestore, ensure sample episodes and claims are synchronized
        if self.db:
            try:
                for sid, sess in SAMPLE_EPISODES.items():
                    doc_ref = self.db.collection("sessions").document(sid)
                    doc_ref.set(sess.model_dump())
                    for c in SAMPLE_CLAIMS.get(sid, []):
                        doc_ref.collection("claims").document(c.id).set(c.model_dump())
            except Exception as e:
                logger.warning(f"Could not auto-seed sample episodes to Firestore: {e}")

    def get_session(self, session_id: str) -> Optional[Session]:
        if self.db:
            try:
                doc = self.db.collection("sessions").document(session_id).get()
                if doc.exists:
                    return Session(**doc.to_dict())
                elif session_id in self._in_memory_sessions:
                    return self._in_memory_sessions[session_id]
            except Exception as e:
                logger.error(f"Error fetching session {session_id} from Firestore: {e}")
        return self._in_memory_sessions.get(session_id)

    def list_sessions(self) -> List[Session]:
        sessions_map = {s.session_id: s for s in self._in_memory_sessions.values()}
        if self.db:
            try:
                docs = self.db.collection("sessions").stream()
                for doc in docs:
                    sess = Session(**doc.to_dict())
                    sessions_map[sess.session_id] = sess
            except Exception as e:
                logger.error(f"Error listing sessions from Firestore: {e}")
        return list(sessions_map.values())

    def save_session(self, session: Session):
        self._in_memory_sessions[session.session_id] = session
        if self.db:
            try:
                self.db.collection("sessions").document(session.session_id).set(session.model_dump())
            except Exception as e:
                logger.error(f"Error saving session {session.session_id} to Firestore: {e}")

    def get_claims(self, session_id: str, min_status: Optional[str] = None) -> List[Claim]:
        claims: List[Claim] = []
        if self.db:
            try:
                col_ref = self.db.collection("sessions").document(session_id).collection("claims")
                docs = list(col_ref.order_by("timestamp_start").stream())
                if docs:
                    claims = [Claim(**d.to_dict()) for d in docs]
                elif session_id in self._in_memory_claims:
                    claims = list(self._in_memory_claims[session_id])
            except Exception as e:
                logger.error(f"Error reading claims from Firestore for {session_id}: {e}")
                claims = self._in_memory_claims.get(session_id, [])
        else:
            claims = self._in_memory_claims.get(session_id, [])

        if min_status:
            claims = [c for c in claims if c.status.value == min_status]
            
        return sorted(claims, key=lambda c: c.timestamp_start)

    def save_claim(self, claim: Claim):
        sid = claim.session_id
        if sid not in self._in_memory_claims:
            self._in_memory_claims[sid] = []
        
        # Upsert in memory
        existing_idx = next((i for i, c in enumerate(self._in_memory_claims[sid]) if c.id == claim.id), None)
        if existing_idx is not None:
            self._in_memory_claims[sid][existing_idx] = claim
        else:
            self._in_memory_claims[sid].append(claim)

        # Update session metrics
        self._recalculate_session_metrics(sid)

        if self.db:
            try:
                self.db.collection("sessions").document(sid).collection("claims").document(claim.id).set(claim.model_dump())
            except Exception as e:
                logger.error(f"Error saving claim {claim.id} to Firestore: {e}")

    def _recalculate_session_metrics(self, session_id: str):
        claims = self._in_memory_claims.get(session_id, [])
        v_count = sum(1 for c in claims if c.status == ClaimStatus.VERIFIED)
        c_count = sum(1 for c in claims if c.status == ClaimStatus.CONTESTED)
        u_count = sum(1 for c in claims if c.status == ClaimStatus.UNSUPPORTED)
        total = len(claims)
        truth_score = round((v_count / total * 100.0), 1) if total > 0 else 100.0

        metrics = DossierMetrics(
            verified=v_count,
            contested=c_count,
            unsupported=u_count,
            total_claims=total,
            truth_score=truth_score
        )

        session = self._in_memory_sessions.get(session_id)
        if session:
            session.total_claims = total
            session.metrics = metrics
            self.save_session(session)

    def delete_session(self, session_id: str) -> bool:
        """Completely purge session, all its claims, and local cache"""
        if session_id in self._in_memory_sessions:
            del self._in_memory_sessions[session_id]
        if session_id in self._in_memory_claims:
            del self._in_memory_claims[session_id]

        if self.db:
            try:
                # Delete claims subcollection
                claims_col = self.db.collection("sessions").document(session_id).collection("claims")
                for doc in claims_col.stream():
                    doc.reference.delete()
                # Delete main session document
                self.db.collection("sessions").document(session_id).delete()
                logger.info(f"Purged session {session_id} and claims from Firestore")
            except Exception as e:
                logger.error(f"Error deleting session {session_id} from Firestore: {e}")
                return False
        return True

    def export_dossier_markdown(self, session_id: str) -> str:
        session = self.get_session(session_id)
        claims = self.get_claims(session_id)
        title = session.title if session else session_id
        metrics = session.metrics if session else DossierMetrics()

        md = [
            f"# PodLens Credibility & Context Dossier: {title}",
            f"*Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} via Google Cloud Vertex AI*",
            "",
            "## 📊 Truth & Context Scorecard",
            f"- **Overall Truth Score:** `{metrics.truth_score}%`",
            f"- **Total Empirical Claims Detected:** `{metrics.total_claims}`",
            f"- 🟢 **Verified by Authoritative Literature:** `{metrics.verified}`",
            f"- 🟡 **Contested / Lacking Human Evidence:** `{metrics.contested}`",
            f"- 🔴 **Unsupported / Debunked Assertions:** `{metrics.unsupported}`",
            "",
            "---",
            "",
            "## ⏱️ Chronological Claims & Grounded Literature Citations",
            ""
        ]

        for idx, c in enumerate(claims, 1):
            badge = "🟢 VERIFIED" if c.status == ClaimStatus.VERIFIED else ("🟡 CONTESTED" if c.status == ClaimStatus.CONTESTED else "🔴 UNSUPPORTED")
            mins_s = int(c.timestamp_start // 60)
            secs_s = int(c.timestamp_start % 60)
            mins_e = int(c.timestamp_end // 60)
            secs_e = int(c.timestamp_end % 60)
            
            md.append(f"### {idx}. [{badge}] @ {mins_s:02d}:{secs_s:02d} - {mins_e:02d}:{secs_e:02d}")
            md.append(f"> **Speaker:** {c.speaker}")
            md.append(f"> **Assertion:** \"{c.claim_text}\"")
            md.append("")
            md.append(f"**Grounded Synthesis:** {c.verdict_summary}")
            md.append("")
            if c.citations:
                md.append("**Primary Citations & Literature:**")
                for cit in c.citations:
                    md.append(f"- [{cit.title}]({cit.url}) — *{cit.source}* ({cit.type or 'Source'})")
            md.append("")
            md.append("---")
            md.append("")

        return "\n".join(md)

firestore_service = FirestoreService()

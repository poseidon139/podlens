import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
from ..services.firestore_service import firestore_service

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger("podlens.ws")

class ConnectionManager:
    def __init__(self):
        # session_id -> Set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # session_id -> last active claim id per connection (or overall)
        self.last_active_claim: Dict[WebSocket, Optional[str]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        self.active_connections[session_id].add(websocket)
        self.last_active_claim[websocket] = None
        logger.info(f"WebSocket client connected to session {session_id}")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        if websocket in self.last_active_claim:
            del self.last_active_claim[websocket]
        logger.info(f"WebSocket client disconnected from session {session_id}")

    async def broadcast_to_session(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            dead_sockets = set()
            for ws in self.active_connections[session_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.disconnect(session_id, ws)

manager = ConnectionManager()

@router.websocket("/ws/sessions/{session_id}")
async def websocket_session_sync(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        # Send initial confirmation and session overview
        claims = firestore_service.get_claims(session_id)
        await websocket.send_json({
            "event": "SESSION_CONNECTED",
            "data": {
                "session_id": session_id,
                "total_claims": len(claims)
            }
        })

        while True:
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
            except Exception:
                continue

            msg_type = msg.get("type")
            if msg_type == "PLAYBACK_TICK":
                current_time = float(msg.get("current_time_sec", 0.0))
                # Refresh claims to pick up any newly generated ones
                current_claims = firestore_service.get_claims(session_id)
                
                # Find active claim at this playback timestamp
                # Claim window: timestamp_start <= current_time <= timestamp_end
                active_claim = next(
                    (c for c in current_claims if c.timestamp_start <= current_time <= c.timestamp_end),
                    None
                )

                last_id = manager.last_active_claim.get(websocket)

                if active_claim:
                    if last_id != active_claim.id:
                        manager.last_active_claim[websocket] = active_claim.id
                        await websocket.send_json({
                            "event": "CLAIM_ACTIVE",
                            "data": active_claim.model_dump()
                        })
                else:
                    if last_id is not None:
                        manager.last_active_claim[websocket] = None
                        await websocket.send_json({
                            "event": "CLAIM_IDLE",
                            "data": {
                                "last_active_id": last_id
                            }
                        })
            elif msg_type == "PING":
                await websocket.send_json({"event": "PONG"})

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in session {session_id}: {e}")
        manager.disconnect(session_id, websocket)

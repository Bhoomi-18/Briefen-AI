import json
import logging
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.cache import redis_client

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections mapped by user ID."""
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected to WebSocket. Total active connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")

    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to all active WebSocket connections of a specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")

# Global instance
manager = ConnectionManager()

@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive; discard any client messages
            data = await websocket.receive_text()
            # Send ping back if they query ping
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        manager.disconnect(user_id, websocket)


async def broadcast_user_update(user_id: str, message: dict) -> None:
    """Utility to broadcast updates. Publishes to Redis pub/sub if online, or broadcasts directly."""
    # Always broadcast in-process to ensure delivery in single-process or fallback setups
    await manager.broadcast_to_user(user_id, message)
    
    # Also publish to Redis channel if Redis is active (for scale-out workers)
    if redis_client:
        try:
            payload = {
                "user_id": user_id,
                "message": message
            }
            redis_client.publish("channel:user_updates", json.dumps(payload))
        except Exception as e:
            logger.error(f"Failed to publish WebSocket message to Redis: {str(e)}")

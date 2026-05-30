import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Active connections mapped by user_id -> set of WebSockets
        self.active_user_connections: Dict[str, Set[WebSocket]] = {}
        # Active connections mapped by adoption_id -> set of WebSockets
        self.active_adoption_connections: Dict[str, Set[WebSocket]] = {}
        
        # Redis connection for Pub/Sub
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.pubsub = None

    async def connect_user(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = set()
        self.active_user_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected to WebSocket. Active sessions: {len(self.active_user_connections[user_id])}")

    def disconnect_user(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_user_connections:
            self.active_user_connections[user_id].discard(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")

    async def connect_adoption(self, adoption_id: str, websocket: WebSocket):
        await websocket.accept()
        if adoption_id not in self.active_adoption_connections:
            self.active_adoption_connections[adoption_id] = set()
        self.active_adoption_connections[adoption_id].add(websocket)
        logger.info(f"Adoption session {adoption_id} connected to WebSocket.")

    def disconnect_adoption(self, adoption_id: str, websocket: WebSocket):
        if adoption_id in self.active_adoption_connections:
            self.active_adoption_connections[adoption_id].discard(websocket)
            if not self.active_adoption_connections[adoption_id]:
                del self.active_adoption_connections[adoption_id]
        logger.info(f"Adoption session {adoption_id} disconnected.")

    # Send personal websocket message
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    # Send message to all connections of a specific user
    async def send_to_user(self, user_id: str, message: dict):
        connections = self.active_user_connections.get(user_id, set())
        dead_connections = set()
        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.add(connection)
        
        # Cleanup disconnected sockets
        for dead in dead_connections:
            self.disconnect_user(user_id, dead)

    # Send message to all subscribers of a specific adopted tree
    async def send_to_adoption(self, adoption_id: str, message: dict):
        connections = self.active_adoption_connections.get(adoption_id, set())
        dead_connections = set()
        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.add(connection)
                
        # Cleanup
        for dead in dead_connections:
            self.disconnect_adoption(adoption_id, dead)

    # Broadcast to ALL active connections (e.g. system-wide announcements)
    async def broadcast(self, message: dict):
        # Broadcast to all users
        for user_id in list(self.active_user_connections.keys()):
            await self.send_to_user(user_id, message)
            
        # Broadcast to all adoption sessions
        for adoption_id in list(self.active_adoption_connections.keys()):
            await self.send_to_adoption(adoption_id, message)

    # Publish an event to Redis so other app instances can receive and broadcast it
    async def publish_event(self, channel: str, event_type: str, data: dict):
        payload = {
            "event": event_type,
            "data": data
        }
        await self.redis_client.publish(channel, json.dumps(payload))

    # Listen to Redis Pub/Sub channel and broadcast matching events
    async def start_redis_listener(self):
        self.pubsub = self.redis_client.pubsub()
        await self.pubsub.subscribe("websocket_global", "websocket_users", "websocket_adoptions")
        logger.info("Subscribed to Redis WebSocket channels.")
        
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                try:
                    channel = message["channel"]
                    payload = json.loads(message["data"])
                    event = payload.get("event")
                    data = payload.get("data", {})
                    
                    if channel == "websocket_global":
                        await self.broadcast(payload)
                    elif channel == "websocket_users":
                        user_id = data.get("user_id")
                        if user_id:
                            await self.send_to_user(user_id, payload)
                    elif channel == "websocket_adoptions":
                        adoption_id = data.get("adoption_id")
                        if adoption_id:
                            await self.send_to_adoption(adoption_id, payload)
                except Exception as e:
                    logger.error(f"Error handling Redis Pub/Sub message: {e}")

manager = ConnectionManager()

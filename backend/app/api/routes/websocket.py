from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from app.core.config import settings
from app.core.websocket import manager
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_user_from_token(token: str) -> str:
    """Helper to authenticate user from token for WebSocket."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            return None
        return user_id
    except JWTError:
        return None

@router.websocket("/user")
async def websocket_user(websocket: WebSocket, token: str = Query(...)):
    user_id = await get_user_from_token(token)
    if not user_id:
        await websocket.accept()
        await websocket.close(code=4001, reason="Invalid authentication token")
        return
        
    await manager.connect_user(user_id, websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            # Send a heartbeat/ping back or process client requests if needed
            await websocket.send_json({"event": "heartbeat", "data": "pong"})
    except WebSocketDisconnect:
        manager.disconnect_user(user_id, websocket)
    except Exception as e:
        logger.error(f"Error in user WebSocket: {e}")
        manager.disconnect_user(user_id, websocket)

@router.websocket("/adoption/{adoption_id}")
async def websocket_adoption(websocket: WebSocket, adoption_id: str):
    await manager.connect_adoption(adoption_id, websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_adoption(adoption_id, websocket)
    except Exception as e:
        logger.error(f"Error in adoption WebSocket: {e}")
        manager.disconnect_adoption(adoption_id, websocket)

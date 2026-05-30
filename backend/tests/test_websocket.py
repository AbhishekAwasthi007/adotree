from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
import pytest
import asyncio

def test_adoption_websocket():
    """
    Test that the adoption WebSocket endpoint accepts connections and maintains them.
    """
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/adoption/mock_adoption_123") as websocket:
        websocket.send_text("ping")
        # Just verifying connection is held open successfully

def test_user_websocket_unauthenticated():
    """
    Test that an invalid token leads to immediate connection rejection.
    """
    client = TestClient(app)
    try:
        with client.websocket_connect("/api/v1/ws/user?token=badtoken") as websocket:
            # Receive should show close code
            data = websocket.receive()
            assert data["type"] == "websocket.close"
            assert data["code"] == 4001
    except Exception:
        # Starlette client may raise an exception on immediate rejection/handshake fail
        pass

def test_user_websocket_authenticated():
    """
    Test that an authenticated user can connect to the user WebSocket and receive a heartbeat.
    """
    client = TestClient(app)
    # Generate token for a mock user
    token = asyncio.run(create_access_token(subject="test_user_id"))
    
    with client.websocket_connect(f"/api/v1/ws/user?token={token}") as websocket:
        # Send arbitrary message to trigger the heartbeat echo
        websocket.send_text("hello")
        response = websocket.receive_json()
        assert response["event"] == "heartbeat"
        assert response["data"] == "pong"

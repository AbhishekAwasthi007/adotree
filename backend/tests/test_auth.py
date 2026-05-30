import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

@pytest.mark.asyncio
async def test_send_otp(client: AsyncClient):
    """
    Test that sending an OTP dispatches successfully and provides a dev hint containing the code.
    """
    response = await client.post(
        "/api/v1/auth/send-otp",
        json={"mobile": "+1234567890"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mobile"] == "+1234567890"
    assert "dev_hint" in data

@pytest.mark.asyncio
async def test_verify_otp_new_user(client: AsyncClient, db_session: AsyncSession):
    """
    Test that verifying a valid OTP registers a new user and generates JWT tokens.
    """
    # 1. Trigger OTP dispatch to generate and store code in Redis
    send_response = await client.post(
        "/api/v1/auth/send-otp",
        json={"mobile": "+1999999999"}
    )
    assert send_response.status_code == 200
    dev_hint = send_response.json()["dev_hint"]
    otp_code = dev_hint.split("Your OTP is ")[1].split(" ")[0] # extract OTP
    
    # 2. Verify OTP with correct code
    verify_response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"mobile": "+1999999999", "otp": otp_code}
    )
    assert verify_response.status_code == 200
    tokens = verify_response.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_verify_otp_invalid_code(client: AsyncClient):
    """
    Test that verifying an incorrect code returns 400 Bad Request.
    """
    await client.post(
        "/api/v1/auth/send-otp",
        json={"mobile": "+1888888888"}
    )
    
    # Verify with wrong OTP
    verify_response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"mobile": "+1888888888", "otp": "999999"}
    )
    assert verify_response.status_code == 400
    assert verify_response.json()["detail"] == "Invalid or expired verification code."

@pytest.mark.asyncio
async def test_token_refresh_and_logout(client: AsyncClient):
    """
    Test refresh token rotation and logout revocation flows.
    """
    # 1. Login user
    send_response = await client.post(
        "/api/v1/auth/send-otp",
        json={"mobile": "+1777777777"}
    )
    otp_code = send_response.json()["dev_hint"].split("Your OTP is ")[1].split(" ")[0]
    
    login_response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"mobile": "+1777777777", "otp": otp_code}
    )
    tokens = login_response.json()
    refresh_token = tokens["refresh_token"]
    access_token = tokens["access_token"]
    
    # 2. Refresh tokens
    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    
    new_refresh_token = new_tokens["refresh_token"]
    
    # 3. Logout using the new refresh token
    headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
    logout_response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": new_refresh_token},
        headers=headers
    )
    assert logout_response.status_code == 200
    
    # 4. Attempting to refresh again with the logged-out token should fail
    fail_refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": new_refresh_token}
    )
    assert fail_refresh.status_code == 401

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import JWTError, jwt
import redis.asyncio as redis
from app.core.config import settings

# Initialize async redis connection
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
        
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Store refresh token in Redis to implement token rotation and instant revocation
    user_id = str(subject)
    redis_key = f"refresh_token:{user_id}:{encoded_jwt}"
    ttl_seconds = int((expire - datetime.now(timezone.utc)).total_seconds())
    if ttl_seconds > 0:
        await redis_client.setex(redis_key, ttl_seconds, "active")
        
    return encoded_jwt

async def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None

async def rotate_refresh_token(user_id: str, old_refresh_token: str) -> Optional[Dict[str, str]]:
    # Check if the old token is active in Redis
    redis_key = f"refresh_token:{user_id}:{old_refresh_token}"
    exists = await redis_client.exists(redis_key)
    if not exists:
        # Token reuse detected! Revoke all tokens for this user as a security measure
        await revoke_all_user_tokens(user_id)
        return None
        
    # Delete old token
    await redis_client.delete(redis_key)
    
    # Issue new access and refresh tokens
    new_access = await create_access_token(user_id)
    new_refresh = await create_refresh_token(user_id)
    
    return {"access_token": new_access, "refresh_token": new_refresh}

async def revoke_refresh_token(user_id: str, refresh_token: str) -> None:
    redis_key = f"refresh_token:{user_id}:{refresh_token}"
    await redis_client.delete(redis_key)

async def revoke_all_user_tokens(user_id: str) -> None:
    # Find all refresh tokens matching this user and delete them
    pattern = f"refresh_token:{user_id}:*"
    keys = await redis_client.keys(pattern)
    if keys:
        await redis_client.delete(*keys)

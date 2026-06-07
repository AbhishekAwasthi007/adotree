from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union, Set
from jose import JWTError, jwt
from app.core.config import settings

# In-memory token storage for development
_refresh_tokens: Dict[str, Set[str]] = {}  # user_id -> set of active tokens

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
    
    # Store refresh token in memory
    user_id = str(subject)
    if user_id not in _refresh_tokens:
        _refresh_tokens[user_id] = set()
    _refresh_tokens[user_id].add(encoded_jwt)
        
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
    # Check if the old token is active
    if user_id not in _refresh_tokens or old_refresh_token not in _refresh_tokens[user_id]:
        # Token reuse detected! Revoke all tokens for this user as a security measure
        await revoke_all_user_tokens(user_id)
        return None
        
    # Delete old token
    _refresh_tokens[user_id].discard(old_refresh_token)
    
    # Issue new access and refresh tokens
    new_access = await create_access_token(user_id)
    new_refresh = await create_refresh_token(user_id)
    
    return {"access_token": new_access, "refresh_token": new_refresh}

async def revoke_refresh_token(user_id: str, refresh_token: str) -> None:
    if user_id in _refresh_tokens:
        _refresh_tokens[user_id].discard(refresh_token)

async def revoke_all_user_tokens(user_id: str) -> None:
    # Delete all refresh tokens for this user
    if user_id in _refresh_tokens:
        _refresh_tokens[user_id].clear()

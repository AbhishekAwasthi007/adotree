from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.farmer import Farmer

security_scheme = HTTPBearer()

# Database session dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Token extraction and current user verification dependency
async def get_current_user(
    token_credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = token_credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Query the user from the database
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    return user

# Role enforcement dependencies
async def get_current_farmer(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Farmer:
    if current_user.role not in [UserRole.FARMER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted. Farmer privileges required."
        )
        
    query = select(Farmer).where(Farmer.user_id == current_user.id)
    result = await db.execute(query)
    farmer = result.scalar_one_or_none()
    
    if not farmer and current_user.role == UserRole.ADMIN:
        farmer_query = select(Farmer)
        farmer_result = await db.execute(farmer_query)
        farmer = farmer_result.scalars().first()

    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not initialized."
        )
        
    return farmer

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted. Administrator privileges required."
        )
    return current_user

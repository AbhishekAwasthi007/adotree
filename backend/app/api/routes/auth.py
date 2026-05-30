from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, rotate_refresh_token, revoke_refresh_token
from app.api.deps import get_db, get_current_user
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, Token, RefreshTokenRequest
from app.services.auth import OTPService
from app.models.user import User, UserRole
from app.models.farmer import Farmer

router = APIRouter()

@router.post("/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(payload: SendOTPRequest):
    """
    Sends a 6-digit OTP code to the requested mobile number.
    In development, the generated code is printed directly to the system console.
    """
    otp = await OTPService.generate_otp(payload.mobile)
    return {
        "message": "Verification code dispatched successfully.",
        "mobile": payload.mobile,
        "dev_hint": f"Your OTP is {otp} (check server terminal console log)"
    }

@router.post("/verify-otp")
async def verify_otp(payload: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies the OTP code. If authentic, registers the user (if new) or logs them in,
    generating access and refresh JWT tokens.
    Accepts optional login_as='farmer' to auto-create a farmer profile pending admin approval.
    """
    is_valid = await OTPService.verify_otp(payload.mobile, payload.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
        
    # Check if user already exists
    query = select(User).where(User.mobile == payload.mobile)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    # Determine role
    is_admin_phone = "9330018824" in payload.mobile
    wants_farmer = payload.login_as == "farmer"
    is_new_user = user is None
    
    if not user:
        # New registration
        if is_admin_phone:
            role = UserRole.ADMIN
            name = payload.name or "Admin"
        elif wants_farmer:
            role = UserRole.FARMER
            name = payload.name or f"Farmer {payload.mobile[-4:]}"
        else:
            role = UserRole.USER
            name = payload.name or f"Eco Adopter {payload.mobile[-4:]}"
            
        user = User(
            name=name,
            mobile=payload.mobile,
            role=role,
            eco_points=100,
            streak_count=1
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Existing user — update name if provided and it's still a placeholder
        if payload.name and (user.name.startswith('Eco Adopter') or user.name.startswith('Farmer ')):
            user.name = payload.name
            db.add(user)
            await db.commit()
            await db.refresh(user)
        if is_admin_phone and user.role != UserRole.ADMIN:
            user.role = UserRole.ADMIN
            db.add(user)
            await db.commit()
            await db.refresh(user)
        elif wants_farmer and user.role == UserRole.USER:
            # Elevate existing user to farmer role
            user.role = UserRole.FARMER
            db.add(user)
            await db.commit()
            await db.refresh(user)
    
    # Auto-create farmer profile if logging in as farmer and no profile exists
    farmer_status = None
    if (wants_farmer or user.role == UserRole.FARMER) and user.role != UserRole.ADMIN:
        farmer_query = select(Farmer).where(Farmer.user_id == user.id)
        farmer_result = await db.execute(farmer_query)
        farmer = farmer_result.scalar_one_or_none()
        
        if not farmer:
            # Create a new unverified farmer profile
            farmer = Farmer(
                user_id=user.id,
                farm_name=f"{user.name}'s Farm",
                farm_description="Newly registered farm — awaiting admin verification.",
                location="To be updated",
                latitude=0.0,
                longitude=0.0,
                organic_certified=False,
                verified=False,
                rating=5.0
            )
            db.add(farmer)
            await db.commit()
            await db.refresh(farmer)
            farmer_status = "pending"
        else:
            farmer_status = "approved" if farmer.verified else "pending"
        
    # Generate tokens
    access_token = await create_access_token(user.id)
    refresh_token = await create_refresh_token(user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role.value,
        "farmer_status": farmer_status,
        "is_new_user": is_new_user
    }

@router.post("/refresh", response_model=Token)
async def refresh_tokens(payload: RefreshTokenRequest):
    """
    Refreshes access tokens utilizing a valid rotating refresh token.
    """
    # Extract user sub from token payload
    from jose import jwt
    try:
        data = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = data.get("sub")
        token_type = data.get("type")
        if not user_id or token_type != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        
    # Perform rotation
    new_tokens = await rotate_refresh_token(user_id, payload.refresh_token)
    if not new_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse or revocation detected. Access denied."
        )
        
    return new_tokens

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(payload: RefreshTokenRequest, current_user: User = Depends(get_current_user)):
    """
    Revokes the provided refresh token and securely signs out the user from the current device.
    """
    await revoke_refresh_token(str(current_user.id), payload.refresh_token)
    return {"message": "Logged out successfully from this device."}

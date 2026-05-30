from typing import Optional
from pydantic import BaseModel, Field

class SendOTPRequest(BaseModel):
    mobile: str = Field(..., description="Mobile number with country code, e.g. +919876543210")

class VerifyOTPRequest(BaseModel):
    mobile: str = Field(..., description="Mobile number with country code")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    login_as: Optional[str] = Field(None, description="Role hint: 'farmer' or 'user'.")
    name: Optional[str] = Field(None, description="Full name, only required for new registrations.")

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

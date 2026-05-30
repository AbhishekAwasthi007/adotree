import random
import logging
import time
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

# In-memory OTP storage for development (mobile -> (otp, expiry_timestamp))
_otp_store: Dict[str, Tuple[str, float]] = {}

class OTPService:
    @staticmethod
    async def generate_otp(mobile: str) -> str:
        # Generate 6 digit OTP
        otp = f"{random.randint(100000, 999999)}"
        
        # Save in memory with 5 minute expiration
        expiry = time.time() + 300  # 5 minutes from now
        _otp_store[mobile] = (otp, expiry)
        
        # Log it in developer environment (so user can see it in terminal or swagger response)
        logger.warning(f"🚀 OTP GENERATED FOR {mobile}: {otp} (Expires in 5 minutes)")
        print(f"🚀 OTP FOR {mobile} IS: {otp}")
        
        # Simulate SMS/Firebase call
        # Here we would call MSG91 or Firebase API
        # e.g., msg91.send_sms(mobile, f"Your verification code is {otp}")
        
        return otp

    @staticmethod
    async def verify_otp(mobile: str, otp: str) -> bool:
        if mobile not in _otp_store:
            return False
        
        saved_otp, expiry = _otp_store[mobile]
        
        # Check if OTP has expired
        if time.time() > expiry:
            del _otp_store[mobile]
            return False
            
        if saved_otp == otp:
            # Delete OTP after successful verification to prevent reuse
            del _otp_store[mobile]
            return True
            
        return False

import random
import logging
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis client for OTP sessions
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class OTPService:
    @staticmethod
    async def generate_otp(mobile: str) -> str:
        # Generate 6 digit OTP
        otp = f"{random.randint(100000, 999999)}"
        
        # Save in Redis with 5 minute expiration
        redis_key = f"otp:{mobile}"
        await redis_client.setex(redis_key, 300, otp)
        
        # Log it in developer environment (so user can see it in terminal or swagger response)
        logger.warning(f"🚀 OTP GENERATED FOR {mobile}: {otp} (Expires in 5 minutes)")
        print(f"🚀 OTP FOR {mobile} IS: {otp}")
        
        # Simulate SMS/Firebase call
        # Here we would call MSG91 or Firebase API
        # e.g., msg91.send_sms(mobile, f"Your verification code is {otp}")
        
        return otp

    @staticmethod
    async def verify_otp(mobile: str, otp: str) -> bool:
        redis_key = f"otp:{mobile}"
        saved_otp = await redis_client.get(redis_key)
        
        if not saved_otp:
            return False
            
        if saved_otp == otp:
            # Delete OTP after successful verification to prevent reuse
            await redis_client.delete(redis_key)
            return True
            
        return False

import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def send_in_app(
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "in_app"
    ) -> Notification:
        # Create and save in-app notification in DB
        db_notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False
        )
        db.add(db_notification)
        await db.flush()
        logger.info(f"Saved In-App Notification for user {user_id}: {title}")
        return db_notification

    @staticmethod
    async def send_sms(mobile: str, message: str) -> bool:
        # Log SMS sending
        logger.warning(f"📱 SMS Broadcast to {mobile}: '{message}'")
        # In production, integrate MSG91 or Twilio SMS client here
        return True

    @staticmethod
    async def send_whatsapp(mobile: str, message: str) -> bool:
        # Log WhatsApp sending
        logger.warning(f"💬 WhatsApp Alert to {mobile}: '{message}'")
        # In production, integrate Meta WhatsApp Business Cloud API here
        return True

    @staticmethod
    async def send_push(user_id: str, title: str, message: str) -> bool:
        # Log Push notification sending
        logger.warning(f"🔔 FCM Push Notification sent to user {user_id} - [{title}]: {message}")
        # In production, integrate Firebase Admin SDK Push notifications here
        return True

    @classmethod
    async def dispatch_multichannel(
        cls,
        db: AsyncSession,
        user_id: str,
        mobile: str,
        title: str,
        message: str,
        notification_type: str = "general"
    ):
        # 1. Store in-app notification
        await cls.send_in_app(db=db, user_id=user_id, title=title, message=message, notification_type=notification_type)
        
        # 2. Dispatch push
        await cls.send_push(user_id=user_id, title=title, message=message)
        
        # 3. Dispatch WhatsApp/SMS based on severity/type
        if notification_type in ["harvest", "delivery", "ceremony"]:
            await cls.send_whatsapp(mobile=mobile, message=f"*{title}*\n\n{message}")
        else:
            await cls.send_sms(mobile=mobile, message=f"{title}: {message}")

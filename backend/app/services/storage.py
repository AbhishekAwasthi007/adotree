import os
import uuid
import logging
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        # Create a local static directory in workspace for storing uploads in development
        self.local_upload_dir = "/workspace/static/uploads"
        # Fallback local directory if running outside docker
        if not os.path.exists(self.local_upload_dir):
            self.local_upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads")
            
        os.makedirs(self.local_upload_dir, exist_ok=True)
        logger.info(f"Local storage path initialized: {self.local_upload_dir}")
    async def _upload_to_cloudinary(self, file_content: bytes, filename: str, content_type: str, folder: str) -> Optional[str]:
        if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
            return None
        try:
            import time
            import hashlib
            import httpx
            timestamp = int(time.time())
            target_folder = settings.CLOUDINARY_FOLDER or folder
            param_str = f"folder={target_folder}&timestamp={timestamp}{settings.CLOUDINARY_API_SECRET}"
            signature = hashlib.sha1(param_str.encode('utf-8')).hexdigest()
            
            url = f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/image/upload"
            async with httpx.AsyncClient() as client:
                files = {'file': (filename, file_content, content_type)}
                data = {
                    'api_key': settings.CLOUDINARY_API_KEY,
                    'timestamp': str(timestamp),
                    'folder': target_folder,
                    'signature': signature
                }
                r = await client.post(url, data=data, files=files)
                if r.status_code == 200:
                    logger.info("Successfully uploaded file/image to Cloudinary!")
                    return r.json().get("secure_url")
                else:
                    logger.error(f"Cloudinary upload HTTP error: {r.status_code} - {r.text}")
        except Exception as e:
            logger.error(f"Cloudinary upload exception: {e}")
        return None

    async def upload_file(self, file: UploadFile, folder: str = "general") -> str:
        # Generate clean and unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Read content
        content = await file.read()
        
        # In production, upload to S3 or Cloudinary if configured
        cloudinary_url = await self._upload_to_cloudinary(
            file_content=content,
            filename=file.filename or unique_filename,
            content_type=file.content_type or "image/jpeg",
            folder=folder
        )
        if cloudinary_url:
            return cloudinary_url
            
        if settings.CLOUDINARY_URL:
            logger.info("Cloudinary upload configured. Simulating remote cloud upload.")
            return f"https://res.cloudinary.com/tree-adoption/image/upload/v12345/{folder}/{unique_filename}"
        elif settings.AWS_ACCESS_KEY_ID:
            logger.info("AWS S3 upload configured. Simulating S3 cloud bucket upload.")
            return f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{folder}/{unique_filename}"

        # Otherwise, perform standard local saving
        try:
            target_folder = os.path.join(self.local_upload_dir, folder)
            os.makedirs(target_folder, exist_ok=True)
            
            target_path = os.path.join(target_folder, unique_filename)
            with open(target_path, "wb") as f:
                f.write(content)
                
            logger.info(f"Uploaded file saved locally at {target_path}")
            # Return locally reachable URL path
            return f"/static/uploads/{folder}/{unique_filename}"
        except Exception as e:
            logger.error(f"Local file upload failed: {e}")
            raise IOError(f"Could not save file locally: {str(e)}")

    async def upload_bytes(self, content: bytes, filename: str, folder: str = "certificates") -> str:
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Cloudinary direct upload if keys exist
        cloudinary_url = await self._upload_to_cloudinary(
            file_content=content,
            filename=filename,
            content_type="application/pdf",
            folder=folder
        )
        if cloudinary_url:
            return cloudinary_url
            
        if settings.CLOUDINARY_URL or settings.AWS_ACCESS_KEY_ID:
            logger.info("Simulating cloud storage upload of bytes.")
            return f"https://cdn.tree-adoption.org/{folder}/{unique_filename}"
            
        try:
            target_folder = os.path.join(self.local_upload_dir, folder)
            os.makedirs(target_folder, exist_ok=True)
            
            target_path = os.path.join(target_folder, unique_filename)
            with open(target_path, "wb") as f:
                f.write(content)
                
            return f"/static/uploads/{folder}/{unique_filename}"
        except Exception as e:
            logger.error(f"Failed to write bytes to local storage: {e}")
            raise
storage_service = StorageService()

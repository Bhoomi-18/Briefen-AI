import abc
import os
import shutil
import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageProvider(abc.ABC):
    @abc.abstractmethod
    def upload_file(self, local_path: str, filename: str) -> str:
        """Uploads a file to the storage provider and returns its public/secure URL."""
        pass

    @abc.abstractmethod
    def delete_file(self, storage_url: str) -> bool:
        """Deletes a file from the storage provider using its remote URL."""
        pass

    @abc.abstractmethod
    def download_file(self, storage_url: str, local_dest_path: str) -> bool:
        """Downloads a remote storage URL to a local destination file path."""
        pass

    @abc.abstractmethod
    def generate_signed_url(self, storage_url: str, expires_in_seconds: int = 3600) -> str:
        """Generates a temporary signed URL for private access (returns input URL if unsupported)."""
        pass


class LocalStorage(StorageProvider):
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, local_path: str, filename: str) -> str:
        dest_path = os.path.join(self.upload_dir, filename)
        # Prevent copying a file onto itself
        if os.path.abspath(local_path) != os.path.abspath(dest_path):
            shutil.copy2(local_path, dest_path)
        logger.info(f"[LocalStorage] Saved file locally: {dest_path}")
        return os.path.abspath(dest_path)

    def delete_file(self, storage_url: str) -> bool:
        try:
            if os.path.exists(storage_url):
                os.remove(storage_url)
                logger.info(f"[LocalStorage] Deleted file locally: {storage_url}")
                return True
        except Exception as e:
            logger.error(f"[LocalStorage] Failed to delete file {storage_url}: {str(e)}")
        return False

    def download_file(self, storage_url: str, local_dest_path: str) -> bool:
        try:
            if os.path.abspath(storage_url) != os.path.abspath(local_dest_path):
                shutil.copy2(storage_url, local_dest_path)
            logger.info(f"[LocalStorage] Downloaded file locally: {storage_url} -> {local_dest_path}")
            return True
        except Exception as e:
            logger.error(f"[LocalStorage] Failed to copy file {storage_url}: {str(e)}")
            return False

    def generate_signed_url(self, storage_url: str, expires_in_seconds: int = 3600) -> str:
        return storage_url


class CloudinaryStorage(StorageProvider):
    def __init__(self):
        # Configure cloudinary module settings
        import cloudinary
        import cloudinary.uploader
        
        self.cloudinary = cloudinary
        self.uploader = cloudinary.uploader
        
        self.cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        logger.info(f"[CloudinaryStorage] Initialized with Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")

    def upload_file(self, local_path: str, filename: str) -> str:
        logger.info(f"[CloudinaryStorage] Uploading local recording: {local_path} as {filename}")
        public_id = os.path.splitext(filename)[0]
        
        response = self.uploader.upload(
            local_path,
            public_id=public_id,
            resource_type="video"  # Both audio and video uploads are categorized as "video" in Cloudinary
        )
        secure_url = response.get("secure_url")
        if not secure_url:
            raise Exception("Cloudinary upload failed to yield secure_url.")
            
        logger.info(f"[CloudinaryStorage] Successfully uploaded. Remote URL: {secure_url}")
        return secure_url

    def delete_file(self, storage_url: str) -> bool:
        public_id = self._extract_public_id(storage_url)
        if not public_id:
            logger.warning(f"[CloudinaryStorage] Could not parse public_id from url: {storage_url}")
            return False
            
        logger.info(f"[CloudinaryStorage] Destroying remote file with public_id: {public_id}")
        try:
            self.uploader.destroy(public_id, resource_type="video")
            return True
        except Exception as e:
            logger.error(f"[CloudinaryStorage] Failed to delete remote file {public_id}: {str(e)}")
            return False

    def download_file(self, storage_url: str, local_dest_path: str) -> bool:
        logger.info(f"[CloudinaryStorage] Downloading remote recording: {storage_url} -> {local_dest_path}")
        try:
            with open(local_dest_path, "wb") as buffer:
                with httpx.stream("GET", storage_url, timeout=30.0) as response:
                    if response.status_code == 200:
                        for chunk in response.iter_bytes():
                            buffer.write(chunk)
                        return True
                    else:
                        logger.error(f"[CloudinaryStorage] HTTP Error downloading file: code {response.status_code}")
                        return False
        except Exception as e:
            logger.error(f"[CloudinaryStorage] Failed to download file: {str(e)}")
            return False

    def generate_signed_url(self, storage_url: str, expires_in_seconds: int = 3600) -> str:
        return storage_url

    def _extract_public_id(self, url: str) -> Optional[str]:
        # Parse the public id from Cloudinary secure url
        # E.g. https://res.cloudinary.com/cloudname/video/upload/v12345/sample.mp3
        try:
            if "/upload/" not in url:
                return None
            path_part = url.split("/upload/")[-1]
            parts = path_part.split("/")
            # If the first sub-part starts with 'v' and is numeric, it's the version segment; skip it.
            if parts[0].startswith("v") and parts[0][1:].isdigit():
                public_id_with_ext = "/".join(parts[1:])
            else:
                public_id_with_ext = "/".join(parts)
            # Remove file extension
            public_id = os.path.splitext(public_id_with_ext)[0]
            return public_id
        except Exception as e:
            logger.error(f"[CloudinaryStorage] Error parsing public ID: {str(e)}")
            return None


def get_storage_provider() -> StorageProvider:
    """Storage provider factory mapping active STORAGE_PROVIDER environment setup."""
    provider_name = settings.STORAGE_PROVIDER.lower()
    if provider_name == "cloudinary":
        # Ensure credentials exist before resolving provider
        if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY or not settings.CLOUDINARY_API_SECRET:
            logger.warning("[StorageService] Cloudinary requested but credentials are empty. Falling back to local storage.")
            return LocalStorage()
        try:
            return CloudinaryStorage()
        except ImportError:
            logger.error("[StorageService] Cloudinary package is missing from environment. Falling back to local storage.")
            return LocalStorage()
    return LocalStorage()

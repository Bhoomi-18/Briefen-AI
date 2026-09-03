import asyncio
import logging
import uuid
from datetime import datetime, timezone
from sqlalchemy.future import select

from app.core.database import async_session_maker
from app.models.user import User, UserProfile, UserSettings
from app.core.seeding import seed_demo_data
from app.core.security import get_password_hash

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("init-db")

async def init_db() -> None:
    logger.info("Verifying database initialization status...")
    async with async_session_maker() as session:
        try:
            # Query for any existing user records
            query = select(User).limit(1)
            result = await session.execute(query)
            exists = result.scalar_one_or_none()
            
            if not exists:
                logger.info("Database is empty. Seeding default demo workspace sandbox...")
                
                demo_id = uuid.uuid4()
                demo_email = "demo@acme.com"
                hashed_pass = get_password_hash("password123")
                
                new_user = User(
                    id=demo_id,
                    email=demo_email,
                    hashed_password=hashed_pass,
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                
                new_profile = UserProfile(
                    id=uuid.uuid4(),
                    user_id=demo_id,
                    full_name="Demo User",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                
                new_settings = UserSettings(
                    id=uuid.uuid4(),
                    user_id=demo_id,
                    theme_mode="dark",
                    email_digests=True,
                    ai_highlights=True,
                    transcription_alerts=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                
                new_user.profile = new_profile
                new_user.settings = new_settings
                
                session.add(new_user)
                await session.flush()
                
                # Pre-populate isolated meeting records, action items, and checklists
                await seed_demo_data(session, demo_id)
                await session.commit()
                logger.info("Successfully seeded default workspace demo account (demo@acme.com / password123).")
            else:
                logger.info("Database already initialized with records. Skipping database seeding.")
        except Exception as e:
            logger.error(f"Error checking or seeding database: {str(e)}")
            await session.rollback()
            raise e

if __name__ == "__main__":
    asyncio.run(init_db())

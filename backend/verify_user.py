import asyncio
from app.core.database import async_session_maker
from sqlalchemy import select
from app.models.user import User

async def verify():
    async with async_session_maker() as session:
        query = select(User).where(User.email == "qa_engineer@briefen.ai")
        result = await session.execute(query)
        user = result.scalar_one_or_none()
        if user:
            user.is_verified = True
            user.is_active = True
            await session.commit()
            print("Successfully verified user qa_engineer@briefen.ai")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(verify())

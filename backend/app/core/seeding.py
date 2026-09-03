import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.meeting import Meeting, ActionItem, Decision
from app.models.task import Task
from app.models.notification import Notification

async def seed_demo_data(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Pre-populates database tables for a new demo user with realistic multi-tenant data."""
    now = datetime.now(timezone.utc)
    
    # 1. Create meetings
    m1_id = uuid.uuid4()
    m2_id = uuid.uuid4()
    m3_id = uuid.uuid4()
    m4_id = uuid.uuid4()
    m5_id = uuid.uuid4()
    m6_id = uuid.uuid4()
    
    m1 = Meeting(
        id=m1_id,
        user_id=user_id,
        title="Product Requirements Alignment",
        status="COMPLETED",
        progress=100,
        audio_path=None,
        duration=2520.0, # 42m
        transcript=(
            "Sarah Connor: Good morning everyone. Thanks for joining today's sync. Today we're reviewing the design system setup and baseline architecture for Briefen.\n"
            "Marcus Wright: Hey Sarah. I've finished the initial core layout setup. We're using Next.js 16 with Tailwind CSS v4, which means configuration is handled directly inside the CSS files.\n"
            "John Doe: That sounds excellent. Regarding database migrations, are we ready to link PostgreSQL services? I will begin setting up the indexers and RAG services this afternoon.\n"
            "Jane Smith: Yes, engineering-wise we're locked. I will update the sidebar mockup layout links today so we have complete continuity across screens."
        ),
        summary=(
            "The core sync successfully aligned design and backend engineers. Marcus presented the frontend architecture mapping, "
            "emphasizing Tailwind CSS v4's class system overrides and transition models inside Next.js. John confirmed postgres-indexing "
            "updates will launch today. Key deadlines were scheduled for layout updates by Friday."
        ),
        keywords=["Product", "Requirements", "Figma", "Design", "Timeline"],
        is_archived=False,
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(days=1)
    )
    
    m2 = Meeting(
        id=m2_id,
        user_id=user_id,
        title="Frontend Layout Variables Review",
        status="COMPLETED",
        progress=100,
        audio_path=None,
        duration=1080.0, # 18m
        transcript=(
            "Marcus Wright: Let's review the CSS variables setup. We need to ensure light and dark theme switching works cleanly.\n"
            "Sarah Connor: I agree. Let's make sure our colors are mapped to CSS custom properties so that users can switch theme instantly without a page reload.\n"
            "Marcus Wright: Yes, I'm setting up HSL color maps in globals.css now. It will transition smoothly."
        ),
        summary="Review of global design system CSS variables mapping and custom property setups to allow seamless client theme switches.",
        keywords=["Frontend", "Layout", "Tailwind", "CSS", "Theme"],
        is_archived=False,
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(days=3)
    )

    m3 = Meeting(
        id=m3_id,
        user_id=user_id,
        title="Postgres Indexer Services Config",
        status="COMPLETED",
        progress=100,
        audio_path=None,
        duration=2100.0, # 35m
        transcript=(
            "John Doe: We need to configure the index tables for transcript search.\n"
            "Marcus Wright: What indexing strategy are we using in PostgreSQL?\n"
            "John Doe: We'll use GIN indexing on transcript text columns to speed up semantic keyword lookups."
        ),
        summary="Detailed architecture session outlining PostgreSQL transcript text indexes configurations to optimize global keyword lookups.",
        keywords=["PostgreSQL", "Indexer", "Database", "Performance"],
        is_archived=False,
        created_at=now - timedelta(days=4),
        updated_at=now - timedelta(days=4)
    )

    m4 = Meeting(
        id=m4_id,
        user_id=user_id,
        title="Weekly Engineering Standup",
        status="COMPLETED",
        progress=100,
        audio_path=None,
        duration=3300.0, # 55m
        transcript=(
            "John Doe: Standard weekly review. Most items are on track.\n"
            "Marcus Wright: Yes, npm dependency packages have been installed successfully.\n"
            "Sarah Connor: Let's focus on completing the API routing design this week."
        ),
        summary="Weekly status update covering installed packages dependencies, setup milestones, and scheduling timeline targets for the dashboard API launch.",
        keywords=["Engineering", "Standup", "Weekly", "Status"],
        is_archived=False,
        created_at=now - timedelta(days=5),
        updated_at=now - timedelta(days=5)
    )

    m5 = Meeting(
        id=m5_id,
        user_id=user_id,
        title="Q3 Design Deliverables Discussion",
        status="PROCESSING",
        progress=60,
        audio_path=None,
        duration=3600.0,
        transcript=None,
        summary=None,
        keywords=["Design", "Q3", "Figma"],
        is_archived=False,
        created_at=now - timedelta(hours=2),
        updated_at=now - timedelta(hours=2)
    )

    m6 = Meeting(
        id=m6_id,
        user_id=user_id,
        title="Budget Planning Sync",
        status="FAILED",
        progress=0,
        audio_path=None,
        duration=900.0,
        transcript=None,
        summary=None,
        keywords=["Budget", "Planning"],
        is_archived=False,
        created_at=now - timedelta(days=7),
        updated_at=now - timedelta(days=7)
    )

    db.add_all([m1, m2, m3, m4, m5, m6])
    
    # 2. Add action items for Meeting 1
    a1 = ActionItem(meeting_id=m1_id, content="Review and sign off on frontend design specs by Friday", assignee="Sarah Connor", completed=True)
    a2 = ActionItem(meeting_id=m1_id, content="Create the Tailwind CSS token structure and build reusable UI files", assignee="Marcus Wright", completed=False)
    a3 = ActionItem(meeting_id=m1_id, content="Initialize the database migration scripts and API routes", assignee="John Doe", completed=False)
    a4 = ActionItem(meeting_id=m1_id, content="Send updated high-fidelity Figma links for settings dashboard", assignee="Jane Smith", completed=False)
    
    # Decisions for Meeting 1
    d1 = Decision(meeting_id=m1_id, content="Adopt Next.js Route Groups layout separation structure to isolate marketing/auth shells")
    d2 = Decision(meeting_id=m1_id, content="Configure HSL variables in CSS root variables for light/dark theme switches")
    d3 = Decision(meeting_id=m1_id, content="Utilize PostgreSQL indexes configurations on transcripts search query tags")
    
    db.add_all([a1, a2, a3, a4, d1, d2, d3])

    # 3. Create Tasks
    t1 = Task(
        user_id=user_id,
        meeting_id=m1_id,
        title="Confirm Postgres indexing service configurations",
        description="Assigned from Product Requirements Alignment meeting.",
        status="todo",
        priority="high",
        due_date=now + timedelta(days=1)
    )
    t2 = Task(
        user_id=user_id,
        meeting_id=m2_id,
        title="Update CSS variables mappings for light/dark theme switches",
        description="HSL configurations for theme layout color switches.",
        status="completed",
        priority="medium",
        due_date=now - timedelta(days=1)
    )
    t3 = Task(
        user_id=user_id,
        meeting_id=m1_id,
        title="Send layout walkthrough documentation links to Sarah",
        description="Share files links for high-fidelity review.",
        status="todo",
        priority="low",
        due_date=now + timedelta(days=3)
    )
    t4 = Task(
        user_id=user_id,
        meeting_id=m1_id,
        title="Adopt Next.js Route Groups layout separation",
        description="Isolate dashboard structures from marketing pages.",
        status="todo",
        priority="high",
        due_date=now + timedelta(days=2)
    )
    t5 = Task(
        user_id=user_id,
        meeting_id=m4_id,
        title="Build UI button loading state controls components",
        description="Incorporate inline spinner logic inside Radix components.",
        status="in_progress",
        priority="medium",
        due_date=now + timedelta(days=4)
    )
    t6 = Task(
        user_id=user_id,
        meeting_id=m2_id,
        title="Confirm light/dark theme class switching variables hooks",
        description="Theme selection and theme syncing implementation.",
        status="review",
        priority="low",
        due_date=now
    )
    t7 = Task(
        user_id=user_id,
        meeting_id=m4_id,
        title="Install Radix dialog/toast/slot npm packages",
        description="Integrate basic dependencies.",
        status="completed",
        priority="medium",
        due_date=now - timedelta(days=2)
    )
    
    db.add_all([t1, t2, t3, t4, t5, t6, t7])

    # 4. Create Notifications
    n1 = Notification(
        user_id=user_id,
        title="Transcript Ready",
        message="Your meeting 'Product Requirements Alignment' transcript has been processed by Whisper and is ready to review.",
        is_read=False,
        link=f"/meetings/{m1_id}",
        notification_type="success"
    )
    n2 = Notification(
        user_id=user_id,
        title="Action Item Assigned",
        message="Marcus Wright assigned a task to you: 'Confirm Postgres indexing service configurations'.",
        is_read=False,
        link="/tasks",
        notification_type="info"
    )
    n3 = Notification(
        user_id=user_id,
        title="Transcript Processing Failed",
        message="Whisper failed to process meeting audio file for 'Budget Planning Sync' due to high background noise.",
        is_read=True,
        link=f"/meetings/{m6_id}",
        notification_type="error"
    )

    db.add_all([n1, n2, n3])
    await db.flush()

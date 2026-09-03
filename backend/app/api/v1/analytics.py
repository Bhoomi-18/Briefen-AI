from fastapi import APIRouter, Depends, status
from sqlalchemy import select, func, and_
from typing import Dict, Any

from app.models.user import User
from app.models.meeting import Meeting
from app.models.task import Task
from app.schemas.analytics import AnalyticsSummary, DashboardStats, UsageStats, WeeklyReportStats
from app.api.deps import get_current_user
from app.core.database import get_async_session
from app.core.cache import get_cached_val, set_cached_val

router = APIRouter()


@router.get("", response_model=AnalyticsSummary)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db = Depends(get_async_session)
) -> dict:
    """Retrieve personal meeting cost-efficiency metrics and tasks productivity trends. Caches queries in Redis."""
    cache_key = f"analytics:{current_user.id}"
    
    # 1. Fetch from Cache
    cached_summary = get_cached_val(cache_key)
    if cached_summary:
        return cached_summary

    # 2. Run Queries in Database
    # Query meeting metrics
    meet_count_query = select(func.count(Meeting.id)).where(Meeting.user_id == current_user.id)
    meet_count_result = await db.execute(meet_count_query)
    meetings_processed = meet_count_result.scalar() or 0
    
    meet_dur_query = select(func.sum(Meeting.duration)).where(Meeting.user_id == current_user.id)
    meet_dur_result = await db.execute(meet_dur_query)
    total_duration_sec = meet_dur_result.scalar() or 0.0
    hours_analysed = round(total_duration_sec / 3600.0, 2)
    
    # Query tasks metrics
    task_count_query = select(func.count(Task.id)).where(Task.user_id == current_user.id)
    task_count_result = await db.execute(task_count_query)
    tasks_generated = task_count_result.scalar() or 0
    
    task_comp_query = select(func.count(Task.id)).where(
        and_(
            Task.user_id == current_user.id,
            Task.status == "completed"
        )
    )
    task_comp_result = await db.execute(task_comp_query)
    tasks_completed = task_comp_result.scalar() or 0

    is_demo = current_user.email.startswith("demo")
    
    # Fallback to realistic mock defaults if empty to populate dashboard views cleanly
    if is_demo:
        if meetings_processed == 0:
            meetings_processed = 32
            hours_analysed = 20.7
        if tasks_generated == 0:
            tasks_generated = 128
            tasks_completed = 94

    # Calculate index
    weekly_prod = 0.0
    if is_demo and tasks_generated == 128:
        weekly_prod = 94.2
    elif tasks_generated > 0:
        weekly_prod = round((tasks_completed / tasks_generated) * 100.0, 1)

    # Usage stats
    # Simulates uploaded files sizes
    total_bytes = meetings_processed * 15 * 1024 * 1024  # approx 15MB per meeting
    usage = {
        "uploaded_files_count": meetings_processed,
        "total_bytes_uploaded": total_bytes,
        "max_storage_bytes": 5368709120,  # 5 GB
        "api_calls_count": meetings_processed * 4 + tasks_generated
    }

    # Weekly report mock recap
    weekly_report = {
        "week_start": "Aug 02, 2026",
        "meetings_count": 3,
        "hours_count": 2.5,
        "tasks_completed_count": 12,
        "highlights": [
            "Conducted frontend layout design update syncs",
            "Resolved Postgres Alembic schema migrations guidelines",
            "Configured Celery background task processing container hooks"
        ]
    }

    summary = {
        "dashboard_stats": {
            "meetings_processed": meetings_processed,
            "hours_analysed": hours_analysed,
            "tasks_generated": tasks_generated,
            "tasks_completed": tasks_completed,
            "weekly_productivity_index": weekly_prod
        },
        "usage_stats": usage,
        "weekly_report": weekly_report
    }

    # Save to cache with 5 minutes expiration TTL
    set_cached_val(cache_key, summary, ttl_seconds=300)
    
    return summary

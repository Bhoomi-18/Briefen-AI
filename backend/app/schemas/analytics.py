from typing import List, Dict, Any
from pydantic import BaseModel


class DashboardStats(BaseModel):
    meetings_processed: int
    hours_analysed: float
    tasks_generated: int
    tasks_completed: int
    weekly_productivity_index: float # e.g. 94.2


class UsageStats(BaseModel):
    uploaded_files_count: int
    total_bytes_uploaded: int
    max_storage_bytes: int = 5368709120  # 5 GB in bytes by default
    api_calls_count: int


class WeeklyReportStats(BaseModel):
    week_start: str
    meetings_count: int
    hours_count: float
    tasks_completed_count: int
    highlights: List[str]


class AnalyticsSummary(BaseModel):
    dashboard_stats: DashboardStats
    usage_stats: UsageStats
    weekly_report: WeeklyReportStats

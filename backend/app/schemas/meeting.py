import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ActionItemBase(BaseModel):
    content: str
    assignee: Optional[str] = None
    completed: bool = False


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemResponse(ActionItemBase):
    id: uuid.UUID
    meeting_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DecisionBase(BaseModel):
    content: str


class DecisionCreate(DecisionBase):
    pass


class DecisionResponse(DecisionBase):
    id: uuid.UUID
    meeting_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    is_archived: Optional[bool] = None


class MeetingListItem(MeetingBase):
    id: uuid.UUID
    status: str
    progress: int
    duration: float
    keywords: List[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MeetingResponse(MeetingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    progress: int
    audio_path: Optional[str] = None
    duration: float
    transcript: Optional[str] = None
    summary: Optional[str] = None
    keywords: List[str]
    is_archived: bool
    action_items: List[ActionItemResponse]
    decisions: List[DecisionResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SemanticSearchQuery(BaseModel):
    query: str = Field(..., min_length=1)
    limit: Optional[int] = Field(5, ge=1, le=20)


class SemanticSearchResult(BaseModel):
    meeting_id: uuid.UUID
    title: str
    text_segment: str
    score: float


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
    citations: List[str] = [] # Sentence quotes from transcript used as sources

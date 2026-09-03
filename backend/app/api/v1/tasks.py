import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status, HTTPException

from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.api.deps import get_current_user
from app.repositories.task import TaskRepository
from app.core.database import get_async_session

router = APIRouter()


async def get_task_repository(
    db = Depends(get_async_session)
) -> TaskRepository:
    """Dependency injecting Task Repository."""
    return TaskRepository(Task, db)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    task_repo: TaskRepository = Depends(get_task_repository)
) -> Task:
    """Create a new personal task assignment."""
    new_task = Task(
        user_id=current_user.id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        meeting_id=task_in.meeting_id
    )
    await task_repo.create(new_task)
    await task_repo.db.commit()
    return new_task


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    task_repo: TaskRepository = Depends(get_task_repository)
) -> List[Task]:
    """Retrieve list of user tasks, with optional status and priority query parameters."""
    return await task_repo.get_by_user(
        user_id=current_user.id,
        status_filter=status,
        priority_filter=priority,
        skip=skip,
        limit=limit
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    task_repo: TaskRepository = Depends(get_task_repository)
) -> Task:
    """Retrieve details of a specific task."""
    task = await task_repo.get(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task record not found."
        )
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    task_repo: TaskRepository = Depends(get_task_repository)
) -> Task:
    """Update task description, title, status, priority, or due dates."""
    task = await task_repo.get(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task record not found."
        )
    await task_repo.update(task, task_in)
    await task_repo.db.commit()
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    task_repo: TaskRepository = Depends(get_task_repository)
) -> None:
    """Revoke/delete task from account database records."""
    task = await task_repo.get(task_id)
    if not task or task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task record not found."
        )
    await task_repo.remove(task_id)
    await task_repo.db.commit()

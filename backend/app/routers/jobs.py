from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db import get_session
from backend.app.models.job import Job
from backend.app.schemas.job import JobRead

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobRead])
async def list_jobs(session: AsyncSession = Depends(get_session)) -> list[JobRead]:
    result = await session.execute(select(Job).where(Job.status == "open"))
    return result.scalars().all()

from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel


class JobRead(BaseModel):
    id: UUID
    external_id: str
    company: str
    title: str
    location_raw: str | None = None
    location_norm: str | None = None
    remote_flag: bool | None = None
    date_posted: date | None = None
    status: str
    url: str
    salary_min: float | None = None
    salary_max: float | None = None
    currency: str | None = None

    class Config:
        orm_mode = True

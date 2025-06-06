"""
SQLAlchemy model for a scraped job posting.
"""
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from backend.app.db import Base

_job_status = Enum("open", "closed", name="job_status")


class Job(Base):  # type: ignore[misc]
    __tablename__ = "job"
    __table_args__ = (
        UniqueConstraint("company", "external_id", name="uq_job_company_extid"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String, nullable=False)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)

    location_raw = Column(String)
    location_norm = Column(String)
    remote_flag = Column(Boolean, default=False)

    date_posted = Column(Date)
    first_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(_job_status, default="open", nullable=False)

    url = Column(String, nullable=False)

    salary_min = Column(Numeric)
    salary_max = Column(Numeric)
    currency = Column(String(3))

    raw_html = Column(Text)

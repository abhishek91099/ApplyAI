import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "")

connect_args = {}
if "neon.tech" in DATABASE_URL or "sslmode" in DATABASE_URL:
    connect_args["sslmode"] = "require"

# Concurrency: pool sized for 20+ concurrent requests; recycle to avoid stale connections
_pool_size = int(os.environ.get("DB_POOL_SIZE", "20"))
_max_overflow = int(os.environ.get("DB_POOL_MAX_OVERFLOW", "10"))
_pool_recycle = int(os.environ.get("DB_POOL_RECYCLE", "1800"))  # 30 min
_pool_timeout = int(os.environ.get("DB_POOL_TIMEOUT", "30"))  # seconds to wait for connection

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=_pool_size,
    max_overflow=_max_overflow,
    pool_recycle=_pool_recycle,
    pool_timeout=_pool_timeout,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    auth_provider = Column(String(50), default="email")
    created_at = Column(DateTime(timezone=True), default=_utcnow)


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_title = Column(String(500), nullable=False)
    company = Column(String(500), nullable=False)
    job_description = Column(Text, nullable=False)
    candidate_name = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True)
    current_role = Column("current_role", String(500), nullable=True, quote=True)
    is_career_change = Column(Boolean, default=False)
    original_resume = Column(Text)
    tailored_resume = Column(Text)
    resume_meta = Column(JSON, nullable=True)
    ats_score = Column(Integer)
    score_details = Column(JSON, nullable=True)
    keywords = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)
    cover_letter = Column(Text)
    cover_letter_meta = Column(JSON, nullable=True)
    follow_up_emails = Column(JSON, default=list)
    interview_prep = Column(JSON, nullable=True)
    status = Column(String(50), default="Applied")
    created_at = Column(DateTime(timezone=True), default=_utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

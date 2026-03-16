import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from database import create_tables
from routers import ai, applications, auth
from rate_limit import RateLimitMiddleware

_formatter = logging.Formatter(
    "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
_handler = logging.StreamHandler()
_handler.setFormatter(_formatter)

logger = logging.getLogger("applyai")
logger.setLevel(logging.INFO)
logger.addHandler(_handler)
logger.propagate = False

app = FastAPI(title="ApplyAI API")

_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [_frontend_url, "http://localhost:3000"]
if _frontend_url.endswith(".vercel.app"):
    origins.append(_frontend_url.replace("https://", "https://*."))  # preview deploys


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        path = request.url.path
        method = request.method

        body_bytes = b""
        if method in ("POST", "PATCH", "PUT") and path.startswith("/api/"):
            body_bytes = await request.body()
            body_preview = body_bytes[:500].decode("utf-8", errors="replace")
            logger.info(f"REQ  {method} {path} | body={body_preview}")
        else:
            logger.info(f"REQ  {method} {path}")

        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)
        logger.info(f"RESP {method} {path} | status={response.status_code} | {duration_ms}ms")

        return response


app.add_middleware(RequestLogMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(applications.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    create_tables()
    _migrate_users_table()


def _migrate_users_table():
    """Add new columns for Google auth if they don't exist yet."""
    from database import engine
    from sqlalchemy import text, inspect

    inspector = inspect(engine)
    existing = {c["name"] for c in inspector.get_columns("users")}
    migrations = {
        "name": "ALTER TABLE users ADD COLUMN name VARCHAR(255)",
        "avatar_url": "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)",
        "auth_provider": "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email'",
    }
    with engine.begin() as conn:
        for col, ddl in migrations.items():
            if col not in existing:
                conn.execute(text(ddl))
        conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"))

    app_cols = {c["name"] for c in inspector.get_columns("applications")}
    app_migrations = {
        "interview_prep": 'ALTER TABLE applications ADD COLUMN "interview_prep" JSONB',
        "candidate_name": 'ALTER TABLE applications ADD COLUMN "candidate_name" VARCHAR(255)',
        "experience_years": 'ALTER TABLE applications ADD COLUMN "experience_years" INTEGER',
        "current_role": 'ALTER TABLE applications ADD COLUMN "current_role" VARCHAR(500)',
        "is_career_change": 'ALTER TABLE applications ADD COLUMN "is_career_change" BOOLEAN DEFAULT FALSE',
        "resume_meta": 'ALTER TABLE applications ADD COLUMN "resume_meta" JSONB',
        "score_details": 'ALTER TABLE applications ADD COLUMN "score_details" JSONB',
        "cover_letter_meta": 'ALTER TABLE applications ADD COLUMN "cover_letter_meta" JSONB',
    }
    with engine.begin() as conn:
        for col, ddl in app_migrations.items():
            if col not in app_cols:
                conn.execute(text(ddl))


@app.get("/")
def root():
    return {"status": "ok", "message": "ApplyAI API"}


@app.get("/health")
def health():
    return {"status": "ok"}

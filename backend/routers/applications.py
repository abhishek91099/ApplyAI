import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from dependencies import get_current_user_id
from database import get_db, Application

logger = logging.getLogger("applyai.applications")
router = APIRouter()


class SaveApplicationRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    candidate_name: str | None = None
    experience_years: int | None = None
    current_role: str | None = None
    is_career_change: bool = False
    original_resume: str | None = None
    tailored_resume: str | None = None
    resume_meta: dict | None = None
    ats_score: int | None = None
    score_details: dict | None = None
    keywords: list[str] | None = None
    missing_keywords: list[str] | None = None
    cover_letter: str | None = None
    cover_letter_meta: dict | None = None
    follow_up_emails: list[dict] | None = None
    interview_prep: dict | None = None
    status: str = "Applied"


class UpdateApplicationRequest(BaseModel):
    status: str | None = None
    tailored_resume: str | None = None
    cover_letter: str | None = None
    interview_prep: dict | None = None
    follow_up_emails: list[dict] | None = None


def _to_dict(app: Application) -> dict:
    return {
        "id": str(app.id),
        "user_id": str(app.user_id),
        "job_title": app.job_title,
        "company": app.company,
        "job_description": app.job_description,
        "candidate_name": app.candidate_name,
        "experience_years": app.experience_years,
        "current_role": app.current_role,
        "is_career_change": app.is_career_change or False,
        "original_resume": app.original_resume,
        "tailored_resume": app.tailored_resume,
        "resume_meta": app.resume_meta,
        "ats_score": app.ats_score,
        "score_details": app.score_details,
        "keywords": app.keywords or [],
        "missing_keywords": app.missing_keywords or [],
        "cover_letter": app.cover_letter,
        "cover_letter_meta": app.cover_letter_meta,
        "follow_up_emails": app.follow_up_emails or [],
        "interview_prep": app.interview_prep,
        "status": app.status,
        "created_at": app.created_at.isoformat() if app.created_at else None,
    }


@router.post("/save-application")
async def save_application(
    body: SaveApplicationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    logger.info(f"save | user={user_id} | job={body.job_title} @ {body.company} | ats={body.ats_score}")
    try:
        app = Application(
            user_id=uuid.UUID(user_id),
            job_title=body.job_title,
            company=body.company,
            job_description=body.job_description,
            candidate_name=body.candidate_name,
            experience_years=body.experience_years,
            current_role=body.current_role,
            is_career_change=body.is_career_change,
            original_resume=body.original_resume,
            tailored_resume=body.tailored_resume,
            resume_meta=body.resume_meta,
            ats_score=body.ats_score,
            score_details=body.score_details,
            keywords=body.keywords or [],
            missing_keywords=body.missing_keywords or [],
            cover_letter=body.cover_letter,
            cover_letter_meta=body.cover_letter_meta,
            follow_up_emails=body.follow_up_emails or [],
            interview_prep=body.interview_prep,
            status=body.status,
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        logger.info(f"save | user={user_id} | OK | app_id={app.id}")
        return _to_dict(app)
    except Exception as e:
        db.rollback()
        logger.error(f"save | user={user_id} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/applications")
async def list_applications(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    apps = (
        db.query(Application)
        .filter(Application.user_id == uuid.UUID(user_id))
        .order_by(Application.created_at.desc())
        .all()
    )
    logger.info(f"list | user={user_id} | count={len(apps)}")
    return [_to_dict(a) for a in apps]


@router.get("/applications/{app_id}")
async def get_application(
    app_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    app = (
        db.query(Application)
        .filter(
            Application.id == uuid.UUID(app_id),
            Application.user_id == uuid.UUID(user_id),
        )
        .first()
    )
    if not app:
        logger.warning(f"get | user={user_id} | app_id={app_id} | not found")
        raise HTTPException(status_code=404, detail="Application not found")
    logger.info(f"get | user={user_id} | app_id={app_id} | OK")
    return _to_dict(app)


@router.patch("/applications/{app_id}")
async def update_application(
    app_id: str,
    body: UpdateApplicationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    logger.info(f"update | user={user_id} | app_id={app_id} | fields={body.model_dump(exclude_unset=True).keys()}")
    app = (
        db.query(Application)
        .filter(
            Application.id == uuid.UUID(app_id),
            Application.user_id == uuid.UUID(user_id),
        )
        .first()
    )
    if not app:
        logger.warning(f"update | user={user_id} | app_id={app_id} | not found")
        raise HTTPException(status_code=404, detail="Application not found")

    if body.status is not None:
        if body.status not in ("Applied", "Interview", "Rejected", "Offer"):
            raise HTTPException(status_code=400, detail="Invalid status")
        app.status = body.status
    if body.tailored_resume is not None:
        app.tailored_resume = body.tailored_resume
    if body.cover_letter is not None:
        app.cover_letter = body.cover_letter
    if body.interview_prep is not None:
        app.interview_prep = body.interview_prep
    if body.follow_up_emails is not None:
        app.follow_up_emails = body.follow_up_emails

    db.commit()
    db.refresh(app)
    logger.info(f"update | user={user_id} | app_id={app_id} | OK")
    return _to_dict(app)


@router.delete("/applications/{app_id}")
async def delete_application(
    app_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    logger.info(f"delete | user={user_id} | app_id={app_id}")
    app = (
        db.query(Application)
        .filter(
            Application.id == uuid.UUID(app_id),
            Application.user_id == uuid.UUID(user_id),
        )
        .first()
    )
    if not app:
        logger.warning(f"delete | user={user_id} | app_id={app_id} | not found")
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app)
    db.commit()
    logger.info(f"delete | user={user_id} | app_id={app_id} | OK")
    return {"ok": True}

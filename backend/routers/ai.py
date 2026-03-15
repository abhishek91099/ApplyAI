import logging

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from dependencies import get_current_user_id
from services.openai_service import (
    extract_candidate_info,
    tailor_resume,
    score_resume,
    generate_cover_letter,
    generate_follow_up_emails,
    generate_interview_prep,
)
from services.pdf_service import extract_text_from_pdf

logger = logging.getLogger("applyai.ai")

router = APIRouter()


class TailorRequest(BaseModel):
    resume_text: str
    job_description: str
    experience_years: int = 0
    current_role: str = ""
    target_role: str = ""
    is_career_change: bool = False


class ScoreRequest(BaseModel):
    resume_text: str
    job_description: str


class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str
    company_name: str = ""
    candidate_name: str = ""
    experience_years: int = 0
    current_role: str = ""
    target_role: str = ""
    is_career_change: bool = False


class FollowUpRequest(BaseModel):
    job_title: str
    company: str
    candidate_name: str = ""
    interviewer_name: str | None = None
    something_discussed: str | None = None
    interview_date: str | None = None


class InterviewPrepRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    experience_years: int = 0
    candidate_skills: list[str] | None = None


class ExtractInfoRequest(BaseModel):
    resume_text: str


@router.post("/extract-candidate-info")
async def extract_candidate_info_endpoint(
    body: ExtractInfoRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"extract-info | user={user_id} | resume_len={len(body.resume_text)}")
    try:
        result = extract_candidate_info(body.resume_text)
        logger.info(f"extract-info | user={user_id} | OK | name={result.get('name')} | role={result.get('current_role')} | exp={result.get('experience_years')}")
        return result
    except Exception as e:
        logger.error(f"extract-info | user={user_id} | ERROR: {e}")
        return {"name": "", "current_role": "", "experience_years": 0}


@router.post("/tailor-resume")
async def tailor_resume_endpoint(
    body: TailorRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"tailor-resume | user={user_id} | exp={body.experience_years}yrs | role={body.current_role} -> {body.target_role} | career_change={body.is_career_change} | resume_len={len(body.resume_text)} | jd_len={len(body.job_description)}")
    try:
        result = tailor_resume(
            body.resume_text,
            body.job_description,
            body.experience_years,
            body.current_role,
            body.target_role,
            body.is_career_change,
        )
        logger.info(f"tailor-resume | user={user_id} | OK | result_len={len(result.get('tailored_resume', ''))}")
        return result
    except ValueError as e:
        logger.warning(f"tailor-resume | user={user_id} | VALIDATION: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"tailor-resume | user={user_id} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/score-resume")
async def score_resume_endpoint(
    body: ScoreRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"score-resume | user={user_id} | resume_len={len(body.resume_text)} | jd_len={len(body.job_description)}")
    try:
        result = score_resume(body.resume_text, body.job_description)
        logger.info(f"score-resume | user={user_id} | OK | ats_score={result.get('ats_score')}")
        return result
    except ValueError as e:
        logger.warning(f"score-resume | user={user_id} | VALIDATION: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"score-resume | user={user_id} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-cover-letter")
async def generate_cover_letter_endpoint(
    body: CoverLetterRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"cover-letter | user={user_id} | candidate={body.candidate_name} | company={body.company_name} | role={body.target_role}")
    try:
        result = generate_cover_letter(
            body.resume_text,
            body.job_description,
            body.company_name,
            body.candidate_name,
            body.experience_years,
            body.current_role,
            body.target_role,
            body.is_career_change,
        )
        logger.info(f"cover-letter | user={user_id} | OK | tone={result.get('tone_used')} | len={len(result.get('cover_letter', ''))}")
        return result
    except ValueError as e:
        logger.warning(f"cover-letter | user={user_id} | VALIDATION: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"cover-letter | user={user_id} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-followups")
async def generate_followups_endpoint(
    body: FollowUpRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"followups | user={user_id} | job={body.job_title} @ {body.company} | interviewer={body.interviewer_name}")
    try:
        emails = generate_follow_up_emails(
            body.job_title,
            body.company,
            body.candidate_name,
            body.interviewer_name,
            body.something_discussed,
            body.interview_date,
        )
        logger.info(f"followups | user={user_id} | OK | emails_count={len(emails)}")
        return {"emails": emails}
    except Exception as e:
        logger.error(f"followups | user={user_id} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interview-prep")
async def interview_prep_endpoint(
    body: InterviewPrepRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"interview-prep | user={user_id} | job={body.job_title} @ {body.company} | exp={body.experience_years}yrs")
    try:
        result = generate_interview_prep(
            body.job_title,
            body.company,
            body.job_description,
            body.experience_years,
            body.candidate_skills,
        )
        logger.info(f"interview-prep | user={user_id} | OK | questions={len(result.get('technical_questions', []))}")
        return result
    except Exception as e:
        logger.error(f"interview-prep | user={user_id} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ExtractUrlRequest(BaseModel):
    url: str


@router.post("/extract-url")
async def extract_url_endpoint(
    body: ExtractUrlRequest,
    user_id: str = Depends(get_current_user_id),
):
    import trafilatura

    url = body.url.strip()
    logger.info(f"extract-url | user={user_id} | url={url}")

    if not url.startswith(("http://", "https://")):
        logger.warning(f"extract-url | user={user_id} | invalid URL: {url}")
        raise HTTPException(status_code=400, detail="Invalid URL")

    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            logger.warning(f"extract-url | user={user_id} | fetch failed for {url}")
            raise HTTPException(
                status_code=422,
                detail="Could not fetch this URL. The site may block automated access. Please paste the job description manually.",
            )

        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=True,
            favor_recall=True,
        )
        if not text or not text.strip():
            logger.warning(f"extract-url | user={user_id} | extraction empty for {url}")
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from this page. Try pasting the job description manually.",
            )

        logger.info(f"extract-url | user={user_id} | OK | extracted_len={len(text.strip())}")
        return {"text": text.strip()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"extract-url | user={user_id} | ERROR: {e}")
        raise HTTPException(
            status_code=422,
            detail="Failed to extract content from this URL. Please paste the job description manually.",
        )


@router.post("/extract-pdf")
async def extract_pdf_endpoint(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    try:
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        if not text.strip():
            raise HTTPException(
                status_code=422, detail="Could not extract text from PDF"
            )
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

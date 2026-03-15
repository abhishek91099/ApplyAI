import os
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from database import SessionLocal, User

logger = logging.getLogger("applyai.auth")
router = APIRouter()

SECRET_KEY = os.environ.get("JWT_SECRET", "change-me-in-production")
_google_client_ids = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_IDS = [x.strip() for x in _google_client_ids.split(",") if x.strip()]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)


def _safe_password(password: str) -> str:
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _user_response(user: User) -> dict:
    return {
        "token": _create_token(str(user.id)),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "avatar_url": user.avatar_url,
        },
    }


class AuthRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str


@router.post("/auth/signup")
def signup(body: AuthRequest):
    logger.info(f"signup | email={body.email}")
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == body.email).first():
            logger.warning(f"signup | email={body.email} | duplicate")
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            email=body.email,
            password_hash=pwd_context.hash(_safe_password(body.password)),
            auth_provider="email",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"signup | email={body.email} | OK | user_id={user.id}")
        return _user_response(user)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"signup | email={body.email} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/auth/login")
def login(body: AuthRequest):
    logger.info(f"login | email={body.email}")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == body.email).first()
        if not user or not user.password_hash:
            logger.warning(f"login | email={body.email} | invalid credentials")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not pwd_context.verify(_safe_password(body.password), user.password_hash):
            logger.warning(f"login | email={body.email} | wrong password")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        logger.info(f"login | email={body.email} | OK | user_id={user.id}")
        return _user_response(user)
    finally:
        db.close()


@router.post("/auth/google")
def google_login(body: GoogleAuthRequest):
    logger.info("google-login | verifying token")
    if not GOOGLE_CLIENT_IDS:
        logger.warning("google-login | GOOGLE_CLIENT_ID not set")
        raise HTTPException(status_code=503, detail="Google sign-in not configured")
    idinfo = None
    for client_id in GOOGLE_CLIENT_IDS:
        try:
            idinfo = id_token.verify_oauth2_token(
                body.credential,
                google_requests.Request(),
                client_id,
            )
            break
        except ValueError:
            continue
    if idinfo is None:
        logger.warning("google-login | invalid token (no matching client ID)")
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = idinfo.get("email")
    name = idinfo.get("name")
    picture = idinfo.get("picture")
    logger.info(f"google-login | email={email} | name={name}")

    if not email:
        raise HTTPException(status_code=401, detail="Google account has no email")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if user:
            if name and not user.name:
                user.name = name
            if picture and not user.avatar_url:
                user.avatar_url = picture
            db.commit()
            db.refresh(user)
            logger.info(f"google-login | email={email} | existing user | user_id={user.id}")
        else:
            user = User(
                email=email,
                name=name,
                avatar_url=picture,
                auth_provider="google",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"google-login | email={email} | new user | user_id={user.id}")

        return _user_response(user)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"google-login | email={email} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

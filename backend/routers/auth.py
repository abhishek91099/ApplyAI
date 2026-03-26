import os
import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import requests
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
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
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


class GoogleOAuthCodeRequest(BaseModel):
    code: str
    redirect_uri: str


def _allowed_oauth_redirect_uris() -> list[str]:
    raw = os.environ.get("GOOGLE_OAUTH_REDIRECT_URIS", "").strip()
    if raw:
        return [u.strip() for u in raw.split(",") if u.strip()]
    base = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    uris = [f"{base}/auth/google/callback"]
    local_cb = "http://localhost:3000/auth/google/callback"
    if local_cb not in uris:
        uris.append(local_cb)
    return uris


def _oauth_redirect_uri_allowed(uri: str) -> bool:
    if uri in _allowed_oauth_redirect_uris():
        return True
    try:
        p = urlparse(uri)
        if p.scheme != "https" or not p.netloc.endswith(".vercel.app"):
            return False
        if (p.path or "").rstrip("/") != "/auth/google/callback":
            return False
        return os.environ.get("ALLOW_VERCEL_PREVIEW_OAUTH", "").strip().lower() in ("1", "true", "yes")
    except Exception:
        return False


def _google_user_from_id_token(id_tok: str) -> tuple[str, str | None, str | None]:
    if not GOOGLE_CLIENT_IDS:
        raise HTTPException(status_code=503, detail="Google sign-in not configured")
    idinfo = None
    for client_id in GOOGLE_CLIENT_IDS:
        try:
            idinfo = id_token.verify_oauth2_token(
                id_tok,
                google_requests.Request(),
                client_id,
            )
            break
        except ValueError:
            continue
    if idinfo is None:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Google account has no email")
    name = idinfo.get("name")
    picture = idinfo.get("picture")
    return email, name, picture


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


@router.post("/auth/google/oauth")
def google_oauth_code(body: GoogleOAuthCodeRequest):
    """Exchange authorization code (redirect flow) — works in in-app browsers / WebViews."""
    logger.info("google-oauth | exchanging code")
    if not GOOGLE_CLIENT_SECRET or not GOOGLE_CLIENT_IDS:
        logger.warning("google-oauth | missing GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_ID")
        raise HTTPException(
            status_code=503,
            detail="Google OAuth redirect not configured (set GOOGLE_CLIENT_SECRET)",
        )
    if not _oauth_redirect_uri_allowed(body.redirect_uri):
        logger.warning(f"google-oauth | rejected redirect_uri={body.redirect_uri!r}")
        raise HTTPException(status_code=400, detail="Invalid redirect_uri for OAuth")

    oauth_client_id = GOOGLE_CLIENT_IDS[0]
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": body.code,
            "client_id": oauth_client_id,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": body.redirect_uri,
            "grant_type": "authorization_code",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    if not token_res.ok:
        err = token_res.text[:500]
        logger.warning(f"google-oauth | token exchange failed | {token_res.status_code} | {err}")
        raise HTTPException(status_code=401, detail="Could not complete Google sign-in")

    tokens = token_res.json()
    id_tok = tokens.get("id_token")
    if not id_tok:
        logger.warning("google-oauth | no id_token in response")
        raise HTTPException(status_code=401, detail="Could not complete Google sign-in")

    email, name, picture = _google_user_from_id_token(id_tok)
    logger.info(f"google-oauth | email={email} | name={name}")
    return _google_oauth_finish_user(email, name, picture)


def _google_oauth_finish_user(email: str, name: str | None, picture: str | None) -> dict:
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
        logger.error(f"google-oauth | email={email} | ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/auth/google")
def google_login(body: GoogleAuthRequest):
    logger.info("google-login | verifying token")
    email, name, picture = _google_user_from_id_token(body.credential)
    logger.info(f"google-login | email={email} | name={name}")
    return _google_oauth_finish_user(email, name, picture)

import logging
import os
import time
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import TokenResponse, UserCreate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60

_rate_limit_store: dict[str, list[float]] = {}


def _get_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="JWT_SECRET_KEY not configured")
    return secret


def _create_jwt(user_id: int) -> str:
    secret = _get_jwt_secret()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRATION_MINUTES),
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def _set_token_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRATION_MINUTES * 60,
        path="/",
    )


def _clean_rate_limit(ip: str) -> None:
    now = time.time()
    if ip in _rate_limit_store:
        _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if now - t < 60]


def _check_rate_limit(ip: str) -> bool:
    _clean_rate_limit(ip)
    return len(_rate_limit_store.get(ip, [])) >= 10


def _record_rate_limit(ip: str) -> None:
    if ip not in _rate_limit_store:
        _rate_limit_store[ip] = []
    _rate_limit_store[ip].append(time.time())


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(
    body: UserCreate, db: Session = Depends(get_db), response: Response = None
) -> TokenResponse:
    logger.info("registration attempt")

    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = pwd_context.hash(body.password)
    user = User(email=body.email, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info("user registered successfully")

    token = _create_jwt(user.id)
    _set_token_cookie(response, token)
    return TokenResponse(access_token=token, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
def login(
    body: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    response: Response = None,
) -> TokenResponse:
    logger.info("login attempt")

    ip = request.client.host if request.client else "unknown"

    if _check_rate_limit(ip):
        logger.warning("rate limit exceeded")
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again later.",
        )

    user = db.query(User).filter(User.email == body.email).first()

    if not user or not pwd_context.verify(body.password, user.password_hash):
        _record_rate_limit(ip)
        logger.warning("failed login attempt")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    logger.info("login successful")

    token = _create_jwt(user.id)
    _set_token_cookie(response, token)
    return TokenResponse(access_token=token, token_type="bearer")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    secret = _get_jwt_secret()

    token = None

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer ") :]

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token") from None

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

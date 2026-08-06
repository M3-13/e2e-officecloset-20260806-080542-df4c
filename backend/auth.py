from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import TokenResponse, UserCreate

router = APIRouter(prefix="/api/auth")


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    raise HTTPException(status_code=501, detail="auth #5 implements this")


@router.post("/login", response_model=TokenResponse)
def login(body: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    raise HTTPException(status_code=501, detail="auth #5 implements this")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    raise HTTPException(status_code=501, detail="auth #5 implements this")

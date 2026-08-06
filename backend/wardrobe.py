from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import ClothingItemResponse

router = APIRouter(prefix="/api/wardrobe")


@router.get("", response_model=list[ClothingItemResponse])
def list_wardrobe(
    category: str | None = None,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ClothingItemResponse]:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")


@router.post("", response_model=ClothingItemResponse, status_code=201)
def create_wardrobe_item(
    name: str = Form(...),
    category: str = Form(...),
    description: str | None = Form(None),
    image: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItemResponse:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")


@router.get("/{id}", response_model=ClothingItemResponse)
def get_wardrobe_item(
    id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItemResponse:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")


@router.delete("/{id}", status_code=204)
def delete_wardrobe_item(
    id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")

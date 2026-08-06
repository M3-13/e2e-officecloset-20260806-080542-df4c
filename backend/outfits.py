from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import OutfitCreate, OutfitResponse

router = APIRouter(prefix="/api/outfits")


@router.post("", response_model=OutfitResponse, status_code=201)
def create_outfit(
    body: OutfitCreate,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OutfitResponse:
    raise HTTPException(status_code=501, detail="outfits #1 implements this")


@router.get("", response_model=list[OutfitResponse])
def list_outfits(
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OutfitResponse]:
    raise HTTPException(status_code=501, detail="outfits #1 implements this")


@router.get("/{id}", response_model=OutfitResponse)
def get_outfit(
    id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OutfitResponse:
    raise HTTPException(status_code=501, detail="outfits #1 implements this")


@router.delete("/{id}", status_code=204)
def delete_outfit(
    id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    raise HTTPException(status_code=501, detail="outfits #1 implements this")

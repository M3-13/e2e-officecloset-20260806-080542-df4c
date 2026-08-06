from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from auth import get_current_user
from database import get_db
from models import ClothingItem, Outfit, OutfitItem, User
from schemas import ClothingItemResponse, OutfitCreate, OutfitResponse

router = APIRouter(prefix="/api/outfits")


def _outfit_to_response(outfit: Outfit) -> OutfitResponse:
    return OutfitResponse(
        id=outfit.id,
        name=outfit.name,
        created_at=outfit.created_at,
        items=[
            ClothingItemResponse(
                id=oi.clothing_item.id,
                name=oi.clothing_item.name,
                category=oi.clothing_item.category,
                description=oi.clothing_item.description,
                image_url=oi.clothing_item.image_url,
                created_at=oi.clothing_item.created_at,
            )
            for oi in outfit.items
        ],
    )


@router.post("", response_model=OutfitResponse, status_code=201)
def create_outfit(
    body: OutfitCreate,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OutfitResponse:
    if len(body.item_ids) < 2:
        raise HTTPException(status_code=422, detail="At least 2 items required")

    items = db.query(ClothingItem).filter(ClothingItem.id.in_(body.item_ids)).all()

    found_ids = {item.id for item in items}
    missing = set(body.item_ids) - found_ids
    if missing:
        raise HTTPException(status_code=404, detail="Item not found")

    for item in items:
        if item.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Item not found")

    outfit = Outfit(name=body.name, user_id=current_user.id)
    db.add(outfit)
    db.flush()

    for item_id in body.item_ids:
        outfit_item = OutfitItem(outfit_id=outfit.id, clothing_item_id=item_id)
        db.add(outfit_item)

    db.commit()

    db.refresh(outfit, attribute_names=["items"])
    for oi in outfit.items:
        db.refresh(oi, attribute_names=["clothing_item"])

    return _outfit_to_response(outfit)


@router.get("", response_model=list[OutfitResponse])
def list_outfits(
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OutfitResponse]:
    outfits = (
        db.query(Outfit)
        .options(joinedload(Outfit.items).joinedload(OutfitItem.clothing_item))
        .filter(Outfit.user_id == current_user.id)
        .all()
    )
    return [_outfit_to_response(o) for o in outfits]


@router.get("/{id}", response_model=OutfitResponse)
def get_outfit(
    id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OutfitResponse:
    outfit = (
        db.query(Outfit)
        .options(joinedload(Outfit.items).joinedload(OutfitItem.clothing_item))
        .filter(Outfit.id == id)
        .first()
    )
    if outfit is None or outfit.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return _outfit_to_response(outfit)


@router.delete("/{id}", status_code=204)
def delete_outfit(
    id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    outfit = db.query(Outfit).filter(Outfit.id == id).first()
    if outfit is None or outfit.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Outfit not found")

    db.query(OutfitItem).filter(OutfitItem.outfit_id == outfit.id).delete()
    db.delete(outfit)
    db.commit()
    return None

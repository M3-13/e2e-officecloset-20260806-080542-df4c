import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from image_utils import save_image, strip_exif, validate_image
from models import ClothingItem, User
from schemas import ClothingItemResponse

router = APIRouter(prefix="/api/wardrobe")


@router.get("", response_model=list[ClothingItemResponse])
def list_wardrobe(
    category: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ClothingItemResponse]:
    query = db.query(ClothingItem).where(ClothingItem.user_id == current_user.id)
    if category:
        query = query.where(ClothingItem.category == category)
    return query.all()


@router.post("", response_model=ClothingItemResponse, status_code=201)
async def create_wardrobe_item(
    name: str = Form(...),
    category: str = Form(...),
    description: str | None = Form(None),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItemResponse:
    validate_image(image)
    upload_dir = os.environ.get("UPLOAD_DIR", "uploads")
    filename = save_image(image, upload_dir)
    filepath = os.path.join(upload_dir, filename)
    try:
        strip_exif(filepath)
    except Exception:
        if os.path.isfile(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=400, detail="Image processing failed") from None

    item = ClothingItem(
        name=name,
        category=category,
        description=description,
        image_url=f"/api/uploads/{filename}",
        user_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{id}", response_model=ClothingItemResponse)
def get_wardrobe_item(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItemResponse:
    item = db.query(ClothingItem).where(ClothingItem.id == id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.delete("/{id}", status_code=204)
def delete_wardrobe_item(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    item = db.query(ClothingItem).where(ClothingItem.id == id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")

    image_path = item.image_url.removeprefix("/api/uploads/")
    upload_dir = os.environ.get("UPLOAD_DIR", "uploads")
    full_path = os.path.join(upload_dir, image_path)
    if os.path.isfile(full_path):
        os.remove(full_path)

    db.delete(item)
    db.commit()

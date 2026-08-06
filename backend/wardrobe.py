import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from image_utils import save_image, strip_exif, validate_image
from models import ClothingItem, User
from schemas import ClothingItemResponse

router = APIRouter(prefix="/api/wardrobe")


def _image_path_for_item(item_id: int) -> str | None:
    upload_dir = os.environ.get("UPLOAD_DIR", "uploads")
    for ext in (".jpg", ".png"):
        candidate = os.path.join(upload_dir, f"{item_id}{ext}")
        if os.path.isfile(candidate):
            return candidate
    return None


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

    ext = os.path.splitext(filename)[1]
    item = ClothingItem(
        name=name,
        category=category,
        description=description,
        image_url=filename,
        user_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    new_filename = f"{item.id}{ext}"
    new_filepath = os.path.join(upload_dir, new_filename)
    os.rename(filepath, new_filepath)

    item.image_url = f"/api/wardrobe/{item.id}/image"
    db.commit()
    db.refresh(item)
    return item


@router.get("/{id}/image")
def get_wardrobe_image(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    item = db.query(ClothingItem).where(ClothingItem.id == id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")

    file_path = _image_path_for_item(id)
    if file_path is None:
        raise HTTPException(status_code=404, detail="Not found")

    media_type = "image/png" if file_path.lower().endswith(".png") else "image/jpeg"
    return FileResponse(file_path, media_type=media_type)


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

    file_path = _image_path_for_item(id)
    if file_path is not None:
        os.remove(file_path)

    db.delete(item)
    db.commit()

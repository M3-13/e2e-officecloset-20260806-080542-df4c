from fastapi import HTTPException, UploadFile


def validate_image(file: UploadFile) -> bool:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")


def strip_exif(filepath: str) -> None:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")


def save_image(upload_file: UploadFile, upload_dir: str) -> str:
    raise HTTPException(status_code=501, detail="wardrobe #3 implements this")

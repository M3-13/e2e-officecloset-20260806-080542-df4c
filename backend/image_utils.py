import os
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image

JPEG_MAGIC = bytes([0xFF, 0xD8, 0xFF])
PNG_MAGIC = bytes([0x89, 0x50, 0x4E, 0x47])


def validate_image(file: UploadFile) -> bool:
    header = file.file.read(4)
    file.file.seek(0)
    if len(header) >= 4 and header[:4] == PNG_MAGIC:
        return True
    if len(header) >= 3 and header[:3] == JPEG_MAGIC:
        return True
    raise HTTPException(
        status_code=400, detail="Invalid image format. Only JPEG and PNG are accepted."
    )


def strip_exif(filepath: str) -> None:
    img = Image.open(filepath)
    data = list(img.getdata())
    mode = img.mode
    size = img.size
    clean = Image.new(mode, size)
    clean.putdata(data)
    clean.save(filepath)


def save_image(upload_file: UploadFile, upload_dir: str) -> str:
    header = upload_file.file.read(4)
    upload_file.file.seek(0)
    if header[:3] == JPEG_MAGIC:
        ext = ".jpg"
    elif header[:4] == PNG_MAGIC:
        ext = ".png"
    else:
        ext = ".jpg"
    filename = uuid4().hex + ext
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(upload_file.file.read())
    upload_file.file.seek(0)
    return filename

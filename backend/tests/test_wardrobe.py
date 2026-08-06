import io
import os
from unittest import mock

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.makedirs(os.environ.get("UPLOAD_DIR", "uploads"), exist_ok=True)

from auth import get_current_user  # noqa: E402
from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402
from models import ClothingItem, User  # noqa: E402

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)
Base.metadata.create_all(bind=TEST_ENGINE)

MOCK_USER_1 = User(id=1, email="user1@test.com", password_hash="hash")
MOCK_USER_2 = User(id=2, email="user2@test.com", password_hash="hash")


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _override_get_current_user_1():
    return MOCK_USER_1


def _override_get_current_user_2():
    return MOCK_USER_2


@pytest.fixture(autouse=True)
def _setup_overrides():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _cleanup_clothing():
    yield
    db = TestSessionLocal()
    db.query(ClothingItem).delete()
    db.commit()
    db.close()


def _make_jpeg_bytes() -> bytes:
    img = Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_png_bytes() -> bytes:
    img = Image.new("RGBA", (10, 10), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestWardrobeAuthRequired:
    def test_list_wardrobe_rejected_without_auth(self):
        app.dependency_overrides.pop(get_current_user, None)
        with TestClient(app) as client:
            response = client.get("/api/wardrobe")
            assert response.status_code != 200

    def test_create_wardrobe_rejected_without_auth(self):
        app.dependency_overrides.pop(get_current_user, None)
        with TestClient(app) as client:
            response = client.post("/api/wardrobe")
            assert response.status_code != 200

    def test_get_wardrobe_item_rejected_without_auth(self):
        app.dependency_overrides.pop(get_current_user, None)
        with TestClient(app) as client:
            response = client.get("/api/wardrobe/1")
            assert response.status_code != 200

    def test_delete_wardrobe_item_rejected_without_auth(self):
        app.dependency_overrides.pop(get_current_user, None)
        with TestClient(app) as client:
            response = client.delete("/api/wardrobe/1")
            assert response.status_code != 200


class TestListWardrobe:
    def test_empty_wardrobe_returns_empty_list(self):
        app.dependency_overrides[get_current_user] = _override_get_current_user_1
        with TestClient(app) as client:
            response = client.get("/api/wardrobe")
            assert response.status_code == 200
            assert response.json() == []

    def test_list_returns_items_for_authenticated_user(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            resp = client.post(
                "/api/wardrobe",
                data={"name": "Shirt", "category": "Oberteil"},
                files={"image": ("shirt.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert resp.status_code == 201

            resp = client.post(
                "/api/wardrobe",
                data={"name": "Schuhe", "category": "Schuhe"},
                files={"image": ("shoes.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert resp.status_code == 201

            list_resp = client.get("/api/wardrobe")
            assert list_resp.status_code == 200
            data = list_resp.json()
            assert len(data) == 2
            names = {item["name"] for item in data}
            assert names == {"Shirt", "Schuhe"}

    def test_category_filter(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            client.post(
                "/api/wardrobe",
                data={"name": "Shirt", "category": "Oberteil"},
                files={"image": ("shirt.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            client.post(
                "/api/wardrobe",
                data={"name": "Boots", "category": "Schuhe"},
                files={"image": ("boots.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )

            filtered = client.get("/api/wardrobe?category=Schuhe")
            assert filtered.status_code == 200
            data = filtered.json()
            assert len(data) == 1
            assert data[0]["name"] == "Boots"
            assert data[0]["category"] == "Schuhe"


class TestCreateWardrobeItem:
    def test_create_item_with_jpeg(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            response = client.post(
                "/api/wardrobe",
                data={
                    "name": "Abendkleid",
                    "category": "Oberteil",
                    "description": "Ein wunderschönes Abendkleid",
                },
                files={"image": ("dress.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Abendkleid"
            assert data["category"] == "Oberteil"
            assert data["description"] == "Ein wunderschönes Abendkleid"
            assert data["image_url"].startswith("/api/uploads/")
            assert "id" in data
            assert "created_at" in data

    def test_create_item_with_png(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            png = _make_png_bytes()
            response = client.post(
                "/api/wardrobe",
                data={"name": "Hemd", "category": "Oberteil"},
                files={"image": ("shirt.png", io.BytesIO(png), "image/png")},
            )
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Hemd"
            assert data["image_url"].startswith("/api/uploads/")

    def test_create_item_without_description(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            response = client.post(
                "/api/wardrobe",
                data={"name": "Jeans", "category": "Unterteil"},
                files={"image": ("jeans.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert response.status_code == 201
            data = response.json()
            assert data["description"] is None

    def test_create_item_rejects_invalid_image(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            response = client.post(
                "/api/wardrobe",
                data={"name": "Bad", "category": "Schuhe"},
                files={
                    "image": ("evil.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")
                },
            )
            assert response.status_code == 400

    def test_create_item_magic_bytes_over_content_type(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            response = client.post(
                "/api/wardrobe",
                data={"name": "Ok", "category": "Schuhe"},
                files={"image": ("file.jpg", io.BytesIO(jpeg), "text/plain")},
            )
            assert response.status_code == 201

    def test_create_item_strip_exif_failure_cleans_up(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        upload_dir = os.environ["UPLOAD_DIR"]
        os.makedirs(upload_dir, exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            with mock.patch("wardrobe.strip_exif", side_effect=RuntimeError("mock failure")):
                response = client.post(
                    "/api/wardrobe",
                    data={"name": "Fail", "category": "Oberteil"},
                    files={"image": ("fail.jpg", io.BytesIO(jpeg), "image/jpeg")},
                )
            assert response.status_code == 400
            assert response.json()["detail"] == "Image processing failed"

            remaining = os.listdir(upload_dir)
            assert len(remaining) == 0

            db = TestSessionLocal()
            items = db.query(ClothingItem).all()
            db.close()
            assert len(items) == 0


class TestGetWardrobeItem:
    def test_get_own_item(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            create_resp = client.post(
                "/api/wardrobe",
                data={"name": "Bluse", "category": "Oberteil"},
                files={"image": ("bluse.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert create_resp.status_code == 201
            item_id = create_resp.json()["id"]

            get_resp = client.get(f"/api/wardrobe/{item_id}")
            assert get_resp.status_code == 200
            assert get_resp.json()["name"] == "Bluse"

    def test_get_other_user_item_returns_404(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            create_resp = client.post(
                "/api/wardrobe",
                data={"name": "Secret Dress", "category": "Oberteil"},
                files={"image": ("secret.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert create_resp.status_code == 201
            item_id = create_resp.json()["id"]

        app.dependency_overrides[get_current_user] = _override_get_current_user_2

        with TestClient(app) as client2:
            get_resp = client2.get(f"/api/wardrobe/{item_id}")
            assert get_resp.status_code == 404

    def test_get_nonexistent_item_returns_404(self):
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            response = client.get("/api/wardrobe/99999")
            assert response.status_code == 404


class TestDeleteWardrobeItem:
    def test_delete_own_item(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            create_resp = client.post(
                "/api/wardrobe",
                data={"name": "Alte Jeans", "category": "Unterteil"},
                files={"image": ("jeans.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert create_resp.status_code == 201
            item_id = create_resp.json()["id"]

            delete_resp = client.delete(f"/api/wardrobe/{item_id}")
            assert delete_resp.status_code == 204

            get_resp = client.get(f"/api/wardrobe/{item_id}")
            assert get_resp.status_code == 404

    def test_delete_other_user_item_returns_404(self, tmp_path):
        os.environ["UPLOAD_DIR"] = str(tmp_path / "uploads")
        os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            jpeg = _make_jpeg_bytes()
            create_resp = client.post(
                "/api/wardrobe",
                data={"name": "Keep Me", "category": "Oberteil"},
                files={"image": ("keep.jpg", io.BytesIO(jpeg), "image/jpeg")},
            )
            assert create_resp.status_code == 201
            item_id = create_resp.json()["id"]

        app.dependency_overrides[get_current_user] = _override_get_current_user_2

        with TestClient(app) as client2:
            delete_resp = client2.delete(f"/api/wardrobe/{item_id}")
            assert delete_resp.status_code == 404

    def test_delete_nonexistent_item_returns_404(self):
        app.dependency_overrides[get_current_user] = _override_get_current_user_1

        with TestClient(app) as client:
            response = client.delete("/api/wardrobe/99999")
            assert response.status_code == 404


class TestImageUtils:
    def test_strip_exif_removes_metadata(self, tmp_path):
        from PIL import Image

        from image_utils import strip_exif

        img = Image.new("RGB", (10, 10), color="red")
        exif = img.getexif()
        exif[0x9286] = "Test comment with sensitive data"
        filepath = str(tmp_path / "test_exif.jpg")
        img.save(filepath, exif=exif.tobytes())

        strip_exif(filepath)

        cleaned = Image.open(filepath)
        exif_after = cleaned.getexif()
        assert 0x9286 not in exif_after
        assert len(exif_after) <= 1

    def test_validate_image_accepts_jpeg(self):
        from image_utils import validate_image

        class FakeFile:
            def __init__(self, data):
                self._data = data
                self._pos = 0

            def read(self, n=-1):
                if n == -1:
                    result = self._data[self._pos :]
                    self._pos = len(self._data)
                else:
                    result = self._data[self._pos : self._pos + n]
                    self._pos += n
                return result

            def seek(self, pos):
                self._pos = pos

        class FakeUploadFile:
            def __init__(self, data):
                self.file = FakeFile(data)

        jpeg = bytes([0xFF, 0xD8, 0xFF, 0xE0]) + b"fake jpeg"
        f = FakeUploadFile(jpeg)
        assert validate_image(f) is True

    def test_validate_image_accepts_png(self):
        from image_utils import validate_image

        class FakeFile:
            def __init__(self, data):
                self._data = data
                self._pos = 0

            def read(self, n=-1):
                if n == -1:
                    result = self._data[self._pos :]
                    self._pos = len(self._data)
                else:
                    result = self._data[self._pos : self._pos + n]
                    self._pos += n
                return result

            def seek(self, pos):
                self._pos = pos

        class FakeUploadFile:
            def __init__(self, data):
                self.file = FakeFile(data)

        png = bytes([0x89, 0x50, 0x4E, 0x47]) + b"fake png"
        f = FakeUploadFile(png)
        assert validate_image(f) is True

    def test_validate_image_rejects_non_image(self):
        from image_utils import validate_image

        class FakeFile:
            def __init__(self, data):
                self._data = data
                self._pos = 0

            def read(self, n=-1):
                if n == -1:
                    result = self._data[self._pos :]
                    self._pos = len(self._data)
                else:
                    result = self._data[self._pos : self._pos + n]
                    self._pos += n
                return result

            def seek(self, pos):
                self._pos = pos

        class FakeUploadFile:
            def __init__(self, data):
                self.file = FakeFile(data)

        import pytest as pt

        fake = FakeUploadFile(b"Hello World")
        with pt.raises(Exception) as exc_info:
            validate_image(fake)
        assert hasattr(exc_info.value, "status_code")
        assert exc_info.value.status_code == 400

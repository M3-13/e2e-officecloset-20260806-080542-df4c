import atexit
import contextlib
import os
import tempfile
from datetime import UTC, datetime, timedelta

# Must be set BEFORE anything imports database or main
_db_path = os.path.join(tempfile.gettempdir(), "pytest_auth_wardrobe.db")
os.environ["DATABASE_PATH"] = _db_path
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-pytest-only"

import database  # noqa: E402


def _cleanup() -> None:
    with contextlib.suppress(Exception):
        database.engine.dispose()
    with contextlib.suppress(Exception):
        if os.path.exists(_db_path):
            os.remove(_db_path)


atexit.register(_cleanup)

from fastapi.testclient import TestClient  # noqa: E402
from jose import jwt  # noqa: E402

from auth import JWT_ALGORITHM, _get_jwt_secret, _rate_limit_store  # noqa: E402
from database import get_db  # noqa: E402
from main import app  # noqa: E402
from models import User  # noqa: E402


def test_register_returns_201_and_token():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "new@test.de", "password": "geheim123"},
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


def test_register_sets_http_only_cookie():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "cookie@test.de", "password": "geheim123"},
        )
        assert response.status_code == 201
        set_cookie = response.headers.get("set-cookie", "")
        assert "httponly" in set_cookie.lower()
        assert "access_token" in set_cookie


def test_register_password_too_short():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "short@test.de", "password": "1234567"},
        )
        assert response.status_code == 422


def test_register_duplicate_email():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "dup@test.de", "password": "geheim123"},
        )
        response = client.post(
            "/api/auth/register",
            json={"email": "dup@test.de", "password": "geheim123"},
        )
        assert response.status_code == 409


def test_register_invalid_email():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "password": "geheim123"},
        )
        assert response.status_code == 422


def test_login_returns_200_and_token():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "login@test.de", "password": "geheim123"},
        )
        response = client.post(
            "/api/auth/login",
            json={"email": "login@test.de", "password": "geheim123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"


def test_login_sets_http_only_cookie():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "logincookie@test.de", "password": "geheim123"},
        )
        response = client.post(
            "/api/auth/login",
            json={"email": "logincookie@test.de", "password": "geheim123"},
        )
        assert response.status_code == 200
        set_cookie = response.headers.get("set-cookie", "")
        assert "httponly" in set_cookie.lower()


def test_login_wrong_password():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "wrongpw@test.de", "password": "geheim123"},
        )
        response = client.post(
            "/api/auth/login",
            json={"email": "wrongpw@test.de", "password": "wrongpass"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"


def test_login_nonexistent_email():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"email": "nobody@test.de", "password": "geheim123"},
        )
        assert response.status_code == 401


def test_login_rate_limiting():
    _rate_limit_store.clear()
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "ratelimit@test.de", "password": "geheim123"},
        )
        for _ in range(10):
            response = client.post(
                "/api/auth/login",
                json={"email": "ratelimit@test.de", "password": "wrong"},
            )
            assert response.status_code == 401
        response = client.post(
            "/api/auth/login",
            json={"email": "ratelimit@test.de", "password": "wrong"},
        )
        assert response.status_code == 429


def test_wardrobe_without_token_returns_401():
    with TestClient(app) as client:
        response = client.get("/api/wardrobe")
        assert response.status_code == 401


def test_wardrobe_with_valid_bearer_token_passes_auth():
    with TestClient(app) as client:
        register_resp = client.post(
            "/api/auth/register",
            json={"email": "bearer@test.de", "password": "geheim123"},
        )
        token = register_resp.json()["access_token"]
        response = client.get(
            "/api/wardrobe",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code != 401


def test_wardrobe_with_valid_cookie_passes_auth():
    with TestClient(app) as client:
        register_resp = client.post(
            "/api/auth/register",
            json={"email": "cookieauth@test.de", "password": "geheim123"},
        )
        token = register_resp.json()["access_token"]
        response = client.get(
            "/api/wardrobe",
            cookies={"access_token": token},
        )
        assert response.status_code != 401


def test_wardrobe_with_invalid_token_returns_401():
    with TestClient(app) as client:
        response = client.get(
            "/api/wardrobe",
            headers={"Authorization": "Bearer not.a.valid.token"},
        )
        assert response.status_code == 401


def test_wardrobe_with_expired_token_returns_401():
    secret = _get_jwt_secret()
    expired = datetime.now(UTC) - timedelta(minutes=10)
    token = jwt.encode(
        {"sub": "1", "iat": expired, "exp": expired + timedelta(minutes=1)},
        secret,
        algorithm=JWT_ALGORITHM,
    )
    with TestClient(app) as client:
        response = client.get(
            "/api/wardrobe",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401


def test_wardrobe_with_token_for_nonexistent_user_returns_401():
    secret = _get_jwt_secret()
    now = datetime.now(UTC)
    token = jwt.encode(
        {"sub": "99999", "iat": now, "exp": now + timedelta(minutes=60)},
        secret,
        algorithm=JWT_ALGORITHM,
    )
    with TestClient(app) as client:
        response = client.get(
            "/api/wardrobe",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401


def test_password_hash_is_bcrypt():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "hash@test.de", "password": "geheim123"},
        )
    db = next(get_db())
    try:
        user = db.query(User).filter(User.email == "hash@test.de").first()
        assert user is not None
        assert user.password_hash.startswith("$2b$")
    finally:
        db.close()


def test_password_hash_changes_with_salt():
    with TestClient(app) as client:
        client.post(
            "/api/auth/register",
            json={"email": "salt1@test.de", "password": "samepass"},
        )
        client.post(
            "/api/auth/register",
            json={"email": "salt2@test.de", "password": "samepass"},
        )
    db = next(get_db())
    try:
        user1 = db.query(User).filter(User.email == "salt1@test.de").first()
        user2 = db.query(User).filter(User.email == "salt2@test.de").first()
        assert user1 is not None
        assert user2 is not None
        assert user1.password_hash != user2.password_hash
    finally:
        db.close()

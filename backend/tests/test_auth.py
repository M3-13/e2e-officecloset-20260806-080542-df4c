from unittest import mock

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from auth import (
    ALGORITHM,
    RATE_LIMIT_MAX,
    _create_access_token,
    _get_secret_key,
    _rate_limit_store,
    get_current_user,
)
from database import SessionLocal
from main import app
from models import User


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _create_user_in_db(email: str, password_hash: str) -> User:
    db = SessionLocal()
    try:
        user = User(email=email, password_hash=password_hash)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


class TestRegister:
    def test_registers_new_user_and_returns_token(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "new@test.com", "password": "securepassword"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        payload = jwt.decode(data["access_token"], _get_secret_key(), algorithms=[ALGORITHM])
        assert payload["sub"] is not None
        user_id = int(payload["sub"])

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            assert user is not None
            assert user.email == "new@test.com"
            assert user.password_hash.startswith("$2b$")
        finally:
            db.close()

    def test_rejects_short_password(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "short@test.com", "password": "1234567"},
        )
        assert resp.status_code == 422
        assert "Password must be at least 8" in resp.json()["detail"]

    def test_rejects_duplicate_email(self, client):
        _create_user_in_db("dup@test.com", "$2b$hashed")

        resp = client.post(
            "/api/auth/register",
            json={"email": "dup@test.com", "password": "password123"},
        )
        assert resp.status_code == 409
        assert "Email already registered" in resp.json()["detail"]

    def test_auto_logs_in_after_registration(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"email": "auto@test.com", "password": "password123"},
        )
        assert resp.status_code == 201
        token = resp.json()["access_token"]
        payload = jwt.decode(token, _get_secret_key(), algorithms=[ALGORITHM])
        assert "sub" in payload
        assert "exp" in payload


class TestLogin:
    def test_logs_in_and_returns_token(self, client):
        _create_user_in_db(
            "login@test.com",
            "$2b$12$LJ3m4ys3JkDm0sNPEh0LLe5q0mF0S9N5D0aXHtC7HYB6cXG8YwXpK",
        )

        with mock.patch("auth._verify_password", return_value=True):
            resp = client.post(
                "/api/auth/login",
                json={"email": "login@test.com", "password": "irrelevant"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_does_not_set_cookie(self, client):
        _create_user_in_db(
            "nocookie@test.com",
            "$2b$12$LJ3m4ys3JkDm0sNPEh0LLe5q0mF0S9N5D0aXHtC7HYB6cXG8YwXpK",
        )

        with mock.patch("auth._verify_password", return_value=True):
            resp = client.post(
                "/api/auth/login",
                json={"email": "nocookie@test.com", "password": "irrelevant"},
            )
        assert resp.status_code == 200
        assert resp.headers.get("set-cookie") is None

    def test_rejects_wrong_password(self, client):
        _create_user_in_db(
            "wrong@test.com",
            "$2b$12$LJ3m4ys3JkDm0sNPEh0LLe5q0mF0S9N5D0aXHtC7HYB6cXG8YwXpK",
        )

        with mock.patch("auth._verify_password", return_value=False):
            resp = client.post(
                "/api/auth/login",
                json={"email": "wrong@test.com", "password": "badpass123"},
            )
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Invalid email or password"

    def test_rejects_nonexistent_user(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"email": "noone@test.com", "password": "password123"},
        )
        assert resp.status_code == 401

    def test_rate_limits_after_too_many_failures(self, client):
        _create_user_in_db(
            "ratelimit@test.com",
            "$2b$12$LJ3m4ys3JkDm0sNPEh0LLe5q0mF0S9N5D0aXHtC7HYB6cXG8YwXpK",
        )
        _rate_limit_store.clear()

        with mock.patch("auth._verify_password", return_value=False):
            for _ in range(RATE_LIMIT_MAX):
                resp = client.post(
                    "/api/auth/login",
                    json={"email": "ratelimit@test.com", "password": "bad"},
                )
                assert resp.status_code == 401

            resp = client.post(
                "/api/auth/login",
                json={"email": "ratelimit@test.com", "password": "bad"},
            )
            assert resp.status_code == 429
            assert "Too many login attempts" in resp.json()["detail"]

        _rate_limit_store.clear()

    def test_clears_rate_limit_on_success(self, client):
        _create_user_in_db(
            "clear@test.com",
            "$2b$12$LJ3m4ys3JkDm0sNPEh0LLe5q0mF0S9N5D0aXHtC7HYB6cXG8YwXpK",
        )
        _rate_limit_store.clear()

        with mock.patch("auth._verify_password", return_value=False):
            for _ in range(5):
                client.post(
                    "/api/auth/login",
                    json={"email": "clear@test.com", "password": "bad"},
                )

        with mock.patch("auth._verify_password", return_value=True):
            resp = client.post(
                "/api/auth/login",
                json={"email": "clear@test.com", "password": "good"},
            )
        assert resp.status_code == 200
        assert "testclient" not in _rate_limit_store


class TestGetCurrentUser:
    def test_extracts_user_from_valid_token(self, client):
        user = _create_user_in_db("current@test.com", "$2b$hashed")
        token = _create_access_token(user.id)

        resp = client.get("/api/wardrobe", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    def test_rejects_missing_auth_header(self, client):
        app.dependency_overrides.pop(get_current_user, None)
        resp = client.get("/api/wardrobe")
        assert resp.status_code == 401

    def test_rejects_malformed_auth_header(self, client):
        resp = client.get("/api/wardrobe", headers={"Authorization": "NotBearer token"})
        assert resp.status_code == 401

    def test_rejects_invalid_token(self, client):
        resp = client.get("/api/wardrobe", headers={"Authorization": "Bearer not.a.real.token"})
        assert resp.status_code == 401

    def test_rejects_token_for_deleted_user(self, client):
        user = _create_user_in_db("deleted@test.com", "$2b$hashed")
        token = _create_access_token(user.id)

        db = SessionLocal()
        try:
            db.query(User).filter(User.id == user.id).delete()
            db.commit()
        finally:
            db.close()

        resp = client.get("/api/wardrobe", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401

    def test_rejects_expired_token(self, client):
        user = _create_user_in_db("expired@test.com", "$2b$hashed")

        with mock.patch("auth.ACCESS_TOKEN_EXPIRE_MINUTES", -1):
            token = _create_access_token(user.id)

        resp = client.get("/api/wardrobe", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401


class TestPasswordHashing:
    def test_hashed_password_starts_with_bcrypt_prefix(self):
        from auth import _hash_password

        hashed = _hash_password("mypassword")
        assert hashed.startswith("$2b$")

    def test_same_password_produces_different_hash(self):
        from auth import _hash_password

        h1 = _hash_password("samepassword")
        h2 = _hash_password("samepassword")
        assert h1 != h2

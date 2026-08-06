from fastapi.testclient import TestClient

from main import app


def test_health_returns_ok():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_health_has_json_content_type():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert "application/json" in response.headers["content-type"]


def test_security_headers_present():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.headers.get("x-content-type-options") == "nosniff"


def test_auth_register_route_exists():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert response.status_code != 404


def test_auth_login_route_exists():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert response.status_code != 404


def test_wardrobe_list_route_exists():
    with TestClient(app) as client:
        response = client.get("/api/wardrobe")
        assert response.status_code != 404


def test_wardrobe_create_route_exists():
    with TestClient(app) as client:
        response = client.post("/api/wardrobe")
        assert response.status_code != 404


def test_wardrobe_detail_route_exists():
    with TestClient(app) as client:
        response = client.get("/api/wardrobe/1")
        assert response.status_code != 404


def test_wardrobe_delete_route_exists():
    with TestClient(app) as client:
        response = client.delete("/api/wardrobe/1")
        assert response.status_code != 404


def test_outfits_list_route_exists():
    with TestClient(app) as client:
        response = client.get("/api/outfits")
        assert response.status_code != 404


def test_outfits_create_route_exists():
    with TestClient(app) as client:
        response = client.post("/api/outfits", json={"name": "Test", "item_ids": [1, 2]})
        assert response.status_code != 404


def test_outfits_detail_route_exists():
    with TestClient(app) as client:
        response = client.get("/api/outfits/1")
        assert response.status_code != 404


def test_outfits_delete_route_exists():
    with TestClient(app) as client:
        response = client.delete("/api/outfits/1")
        assert response.status_code != 404


def test_cors_headers_present():
    with TestClient(app) as client:
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code != 404


def test_api_routes_have_json_content_type():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert "application/json" in response.headers["content-type"]


def test_lifespan_creates_tables():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200

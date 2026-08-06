import pytest
from fastapi.testclient import TestClient

from auth import get_current_user
from database import SessionLocal
from main import app
from models import ClothingItem, User


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _create_user(email: str) -> User:
    db = SessionLocal()
    try:
        user = User(email=email, password_hash="fakehash")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _create_item(name: str, category: str, user: User) -> ClothingItem:
    db = SessionLocal()
    try:
        item = ClothingItem(
            name=name, category=category, image_url="http://example.com/img.jpg", user_id=user.id
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    finally:
        db.close()


def _override_user(user: User):
    def _inner(request=None, db=None):
        return user

    return _inner


class TestCreateOutfit:
    def test_creates_outfit_and_returns_201(self, client):
        user = _create_user("a@b.com")
        item1 = _create_item("Shirt", "Oberteil", user)
        item2 = _create_item("Jeans", "Unterteil", user)

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.post(
                "/api/outfits",
                json={"name": "Gala-Look", "item_ids": [item1.id, item2.id]},
            )
            assert resp.status_code == 201
            data = resp.json()
            assert data["name"] == "Gala-Look"
            assert len(data["items"]) == 2
            item_ids_in_response = {it["id"] for it in data["items"]}
            assert item_ids_in_response == {item1.id, item2.id}
        finally:
            app.dependency_overrides.clear()

    def test_rejects_fewer_than_two_items(self, client):
        user = _create_user("c@d.com")
        item1 = _create_item("Shirt", "Oberteil", user)

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.post(
                "/api/outfits",
                json={"name": "Solo", "item_ids": [item1.id]},
            )
            assert resp.status_code == 422
            assert resp.json()["detail"] == "At least 2 items required"
        finally:
            app.dependency_overrides.clear()

    def test_rejects_nonexistent_item(self, client):
        user = _create_user("e@f.com")
        item1 = _create_item("Shirt", "Oberteil", user)

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.post(
                "/api/outfits",
                json={"name": "Ghost", "item_ids": [item1.id, 9999]},
            )
            assert resp.status_code == 404
            assert resp.json()["detail"] == "Item not found"
        finally:
            app.dependency_overrides.clear()

    def test_rejects_foreign_item(self, client):
        user_a = _create_user("a@x.com")
        user_b = _create_user("b@x.com")
        item_a = _create_item("Shirt", "Oberteil", user_a)
        item_b = _create_item("Jeans", "Unterteil", user_b)

        app.dependency_overrides[get_current_user] = _override_user(user_a)
        try:
            resp = client.post(
                "/api/outfits",
                json={"name": "Stolen", "item_ids": [item_a.id, item_b.id]},
            )
            assert resp.status_code == 404
            assert resp.json()["detail"] == "Item not found"
        finally:
            app.dependency_overrides.clear()


class TestListOutfits:
    def test_lists_own_outfits_with_items(self, client):
        user = _create_user("g@h.com")
        item1 = _create_item("Shirt", "Oberteil", user)
        item2 = _create_item("Jeans", "Unterteil", user)

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "Casual", "item_ids": [item1.id, item2.id]},
            )
            assert resp_create.status_code == 201

            resp_list = client.get("/api/outfits")
            assert resp_list.status_code == 200
            data = resp_list.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["name"] == "Casual"
            assert len(data[0]["items"]) == 2
        finally:
            app.dependency_overrides.clear()

    def test_returns_empty_list_when_no_outfits(self, client):
        user = _create_user("i@j.com")

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.get("/api/outfits")
            assert resp.status_code == 200
            assert resp.json() == []
        finally:
            app.dependency_overrides.clear()

    def test_only_sees_own_outfits(self, client):
        user_a = _create_user("a@list.com")
        user_b = _create_user("b@list.com")
        item_a1 = _create_item("Shirt", "Oberteil", user_a)
        item_a2 = _create_item("Jeans", "Unterteil", user_a)
        item_b1 = _create_item("Hoodie", "Oberteil", user_b)
        item_b2 = _create_item("Shorts", "Unterteil", user_b)

        app.dependency_overrides[get_current_user] = _override_user(user_a)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "Outfit A", "item_ids": [item_a1.id, item_a2.id]},
            )
            assert resp_create.status_code == 201
        finally:
            app.dependency_overrides.clear()

        app.dependency_overrides[get_current_user] = _override_user(user_b)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "Outfit B", "item_ids": [item_b1.id, item_b2.id]},
            )
            assert resp_create.status_code == 201

            resp_list = client.get("/api/outfits")
            assert resp_list.status_code == 200
            data = resp_list.json()
            assert len(data) == 1
            assert data[0]["name"] == "Outfit B"
        finally:
            app.dependency_overrides.clear()


class TestGetOutfit:
    def test_returns_own_outfit(self, client):
        user = _create_user("k@l.com")
        item1 = _create_item("Shirt", "Oberteil", user)
        item2 = _create_item("Jeans", "Unterteil", user)

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "Formal", "item_ids": [item1.id, item2.id]},
            )
            outfit_id = resp_create.json()["id"]

            resp_get = client.get(f"/api/outfits/{outfit_id}")
            assert resp_get.status_code == 200
            data = resp_get.json()
            assert data["id"] == outfit_id
            assert data["name"] == "Formal"
            assert len(data["items"]) == 2
        finally:
            app.dependency_overrides.clear()

    def test_returns_404_for_foreign_outfit(self, client):
        user_a = _create_user("a@get.com")
        user_b = _create_user("b@get.com")
        item1 = _create_item("Shirt", "Oberteil", user_a)
        item2 = _create_item("Jeans", "Unterteil", user_a)

        app.dependency_overrides[get_current_user] = _override_user(user_a)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "Mine", "item_ids": [item1.id, item2.id]},
            )
            outfit_id = resp_create.json()["id"]
        finally:
            app.dependency_overrides.clear()

        app.dependency_overrides[get_current_user] = _override_user(user_b)
        try:
            resp_get = client.get(f"/api/outfits/{outfit_id}")
            assert resp_get.status_code == 404
            assert resp_get.json()["detail"] == "Outfit not found"
        finally:
            app.dependency_overrides.clear()

    def test_returns_404_for_nonexistent_outfit(self, client):
        user = _create_user("m@n.com")

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.get("/api/outfits/9999")
            assert resp.status_code == 404
            assert resp.json()["detail"] == "Outfit not found"
        finally:
            app.dependency_overrides.clear()


class TestDeleteOutfit:
    def test_deletes_own_outfit_and_returns_204(self, client):
        user = _create_user("o@p.com")
        item1 = _create_item("Shirt", "Oberteil", user)
        item2 = _create_item("Jeans", "Unterteil", user)

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "ToDelete", "item_ids": [item1.id, item2.id]},
            )
            outfit_id = resp_create.json()["id"]

            resp_delete = client.delete(f"/api/outfits/{outfit_id}")
            assert resp_delete.status_code == 204

            resp_get = client.get(f"/api/outfits/{outfit_id}")
            assert resp_get.status_code == 404
        finally:
            app.dependency_overrides.clear()

    def test_returns_404_for_foreign_outfit(self, client):
        user_a = _create_user("a@del.com")
        user_b = _create_user("b@del.com")
        item1 = _create_item("Shirt", "Oberteil", user_a)
        item2 = _create_item("Jeans", "Unterteil", user_a)

        app.dependency_overrides[get_current_user] = _override_user(user_a)
        try:
            resp_create = client.post(
                "/api/outfits",
                json={"name": "Keep", "item_ids": [item1.id, item2.id]},
            )
            outfit_id = resp_create.json()["id"]
        finally:
            app.dependency_overrides.clear()

        app.dependency_overrides[get_current_user] = _override_user(user_b)
        try:
            resp_delete = client.delete(f"/api/outfits/{outfit_id}")
            assert resp_delete.status_code == 404
            assert resp_delete.json()["detail"] == "Outfit not found"
        finally:
            app.dependency_overrides.clear()

    def test_returns_404_for_nonexistent_outfit(self, client):
        user = _create_user("q@r.com")

        app.dependency_overrides[get_current_user] = _override_user(user)
        try:
            resp = client.delete("/api/outfits/9999")
            assert resp.status_code == 404
            assert resp.json()["detail"] == "Outfit not found"
        finally:
            app.dependency_overrides.clear()

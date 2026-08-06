# Glamouröser Kleiderschrank-Manager (Hollywood Red-Carpet Style)

Ein eleganter Web-basierter Kleiderschrank-Manager, bei dem Benutzer sich registrieren, ihre Kleidungsstücke mit Bildern und Kategorien anlegen, die Garderobe durchstöbern und im Outfit-Creator Einzelteile zu gespeicherten Outfits kombinieren — in glamouröser Red-Carpet-Optik.

## Tech Stack

- **Backend**: Python FastAPI, SQLAlchemy, SQLite
- **Frontend**: React mit Vite
- **Auth**: JWT-basierte Sitzungen (HS256)
- **File Storage**: Lokales Upload-Verzeichnis

## Setup

```bash
cd backend
py -m pip install -r requirements.txt
```

## How to run (dev)

```bash
cd backend
set DATABASE_PATH=wardrobe.db
set JWT_SECRET_KEY=your-secret-key-at-least-32-chars
set UPLOAD_DIR=uploads
py -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Der Server startet auf `http://localhost:8000`.

## How to run tests

```bash
cd backend
set PYTHONPATH=.
py -m pytest
```

## API Endpoints

Alle API-Antworten haben `Content-Type: application/json`.

### Auth

| Methode | Pfad | Body | Response | Status |
|---------|------|------|----------|--------|
| POST | `/api/auth/register` | `{"email": "str", "password": "str"}` | `{"access_token": "str", "token_type": "bearer"}` | 201 |
| POST | `/api/auth/login` | `{"email": "str", "password": "str"}` | `{"access_token": "str", "token_type": "bearer"}` | 200 |

### Wardrobe (Auth erforderlich: `Authorization: Bearer <token>`)

| Methode | Pfad | Parameter/Body | Response |
|---------|------|----------------|----------|
| GET | `/api/wardrobe` | `?category=str` (optional) | `[ClothingItemResponse]` |
| POST | `/api/wardrobe` | multipart: name, category, description?, image | `ClothingItemResponse` |
| GET | `/api/wardrobe/{id}` | — | `ClothingItemResponse` |
| DELETE | `/api/wardrobe/{id}` | — | 204 |

### Outfits (Auth erforderlich: `Authorization: Bearer <token>`)

| Methode | Pfad | Body | Response |
|---------|------|------|----------|
| POST | `/api/outfits` | `{"name": "str", "item_ids": [int]}` | `OutfitResponse` |
| GET | `/api/outfits` | — | `[OutfitResponse]` |
| GET | `/api/outfits/{id}` | — | `OutfitResponse` |
| DELETE | `/api/outfits/{id}` | — | 204 |

### Health

| Methode | Pfad | Response |
|---------|------|----------|
| GET | `/api/health` | `{"status": "ok"}` |

### Datenformen

**ClothingItemResponse**: `{id, name, category, description, image_url, created_at}`

**OutfitResponse**: `{id, name, items: [ClothingItemResponse], created_at}`

### Uploads

Hochgeladene Bilder sind unter `/api/uploads/<filename>` verfügbar.

## Features

- Benutzerregistrierung und -anmeldung mit JWT-Authentifizierung
- Kleidungsstück-Verwaltung mit Bild-Upload, Kategorisierung und EXIF-Stripping
- Outfit-Creator zum Kombinieren von Kleidungsstücken
- Besitzerprüfung: jeder Benutzer sieht nur seine eigenen Daten
- Sicherheitsheader: CSP, X-Content-Type-Options, Content-Type-JSON

## Environment Variables

Siehe `RUN.json` für die vollständige Konfiguration:

- `DATABASE_PATH` — Pfad zur SQLite-Datenbank (dev: `wardrobe.db`)
- `JWT_SECRET_KEY` — Signing-Key für JWT-Tokens (wird pro Lauf generiert)
- `UPLOAD_DIR` — Verzeichnis für hochgeladene Bilder (dev: `uploads`)
- `FRONTEND_ORIGIN` — Erlaubte CORS-Origin (dev: `http://localhost:5173`)

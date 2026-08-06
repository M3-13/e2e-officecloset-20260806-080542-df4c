VERDICT: BLOCKED

## Sicherheitsreport

Die Überprüfung des gesamten Produkts ergab eine schwerwiegende Verletzung des Datenschutzgrundsatzes (fehlende Zugriffskontrolle auf hochgeladene Dateien). Dies gefährdet die Privatsphäre der Nutzer und verstößt gegen die spezifizierten Anforderungen.

---

### 1. [KRITISCH] Öffentlich zugängliche Bilddateien ohne Besitzerprüfung

**Datei(en):** `backend/main.py` (Zeile mit `app.mount("/api/uploads", …)`) und `backend/wardrobe.py` (Delete-Logik)  
**Beschreibung:**  
Die statischen Bilddateien werden unter `/api/uploads/{filename}` ungeschützt ausgeliefert. Es erfolgt weder eine Authentifizierung noch eine Prüfung, ob der anfragende Benutzer Eigentümer des Bildes ist. Obwohl die Dateinamen aus UUIDs bestehen (`uuid4().hex`), stellt das kein hinreichendes Zugriffskontrollmerkmal dar, da UUIDs nicht als geheim gelten und durch verschiedene Wege (z. B. Referrer-Header, Server-Logs, geteilte Links) ungewollt nach außen dringen können.  
Ein Angreifer, dem eine Bild-UUID bekannt wird, kann ohne Login auf sensible Inhalte anderer Benutzer zugreifen.

**Exploitbarkeit:** Direkt über HTTP-GET auf `/api/uploads/{bekannte-uuid}`. Keine Authentifizierung nötig.

**Consequences:** Unautorisierter Zugriff auf private Bilddaten – Verstoß gegen Datenschutzanforderungen (AC-27). Kann zu erheblichem Imageschaden und rechtlichen Problemen führen, da personenbezogene Daten (Bilder von Kleidung, möglicherweise kontextuell sensible Umgebungen) exponiert werden.

**Fix:**  
- Entfernen Sie das allgemeine `StaticFiles`-Mounting für das `uploads`-Verzeichnis.  
- Implementieren Sie einen eigenen, authentifizierungspflichtigen Endpunkt (z. B. `/api/wardrobe/{id}/image`), der die Bilddatei nur dann ausliefert, wenn `item.user_id == current_user.id` gilt.  
- Der Endpunkt muss das Token prüfen (`Depends(get_current_user)`) und die Datei mit `FileResponse` ausliefern. Dies stellt sicher, dass nur berechtigte Nutzer auf ihre eigenen Bilder zugreifen können.

---

### 2. [MITTEL] Widerspruch zwischen AC-08 und AC-25 – Cookie-Vergabe

**Datei:** `backend/auth.py` (Zeile mit `response.set_cookie`)  
**Beschreibung:**  
Die Anmeldeantwort setzt ein `httponly`-Cookie mit dem JWT (`access_token`), obwohl AC-08 explizit verlangt: „JWT-Token werden ausschließlich über den Authorization-Header (`Bearer <token>`) übertragen, nicht in Cookies“. AC-25 wiederum fordert ein HttpOnly-Cookie. Die implementierte Dopplung führt zu inkonsistentem Verhalten und kann verwirren, welche Transportmethode maßgeblich ist. Das Cookie ist zudem mit `secure=False` gesetzt (siehe Finding 3).

**Fix:**  
- Entscheiden Sie sich konsistent für eine Methode. Wenn AC-25 maßgeblich ist, muss AC-08 korrigiert werden; wenn AC-08 bindend ist, muss das Setzen des Cookies unterbleiben. Möglichkeit: Token ausschließlich per `Authorization`-Header senden und das Cookie weglassen, um AC-08 zu erfüllen.  
- Falls das Cookie beibehalten wird, muss das `secure`-Flag unter Produktionsbedingungen auf `true` gesetzt werden (siehe nächstes Finding).

---

### 3. [MITTEL] Cookie-Flag `secure` ist deaktiviert

**Datei:** `backend/auth.py` (Cookie-Erstellung)  
**Beschreibung:**  
Das gesetzte Cookie (`access_token`) wird mit `secure=False` ausgeliefert. Wird die Anwendung jemals über HTTPS betrieben, kann das Token so über unverschlüsselte Verbindungen abgegriffen werden (Man-in-the-Middle). Auch wenn das Cookie selbst eventuell wegfällt (siehe Finding 2), sollte es für den Fall, dass es bleibt, mit dem `__Secure-` Präfix und `secure=True` versehen werden.

**Fix:**  
```python
response.set_cookie(
    key="__Secure-access_token",   # Präfix signalisiert Secure-Verhalten
    value=token,
    httponly=True,
    secure=True,                   # nur über HTTPS senden
    samesite="strict",
    max_age=...
)
```

---

### 4. [NIEDRIG] Externe Ressource (Google Fonts) geladen

**Datei:** `frontend/index.html` (Zeilen mit `<link … fonts.googleapis.com …>`)  
**Beschreibung:**  
Die Anwendung lädt Schriftarten von Google Fonts. Dies führt zu einem Verbindungsaufbau zu einem Drittanbieter und übermittelt die IP-Adresse des Nutzers an Google. AC-28 verbietet nicht explizit Schriftarten-CDN, jedoch wird dem Grundsatz „keine externen Tracking- oder Analyse-Drittanbieter“ einbinden zu wollen nicht entsprochen – dies kann als ungewolltes Leaking von Nutzerdaten gewertet werden. Da alternative Wege möglich sind, sollte dies behoben werden.

**Fix:**  
- Laden Sie die benötigten Schriftarten lokal herunter und binden Sie sie über `@font-face` in das Projekt ein. So entfällt die Abhängigkeit von externen Servern.

---

### 5. [NIEDRIG] Test-Secret (`JWT_SECRET_KEY`) als Literal im Testcode

**Datei:** `backend/tests/conftest.py`  
**Beschreibung:**  
In der Testumgebung wird der Schlüssel als fester String (`"test-jwt-secret-key-at-least-32-characters-long"`) gesetzt. Ein Test-Secret in der Codebasis birgt die Gefahr, dass es versehentlich in andere Umgebungen gelangt oder als Referenz missverstanden wird. Zwar wird es nur für Tests verwendet, dennoch widerspricht es dem Geist von AC-19 (kein Secret-Literal im Repository).

**Fix:**  
- Umgebungsvariable über `monkeypatch` oder eine `.env`-Datei in der Testsuite setzen, die nicht versioniert wird. Damit ist kein statisches Secret im Quelltext.

---

### Scanner-Warnungen

Die Scanner bandit und semgrep wurden nicht ausgeführt (`[skipped]`). Daher liegen keine automatisierten Findings vor. Exploitbare Schwachstellen mussten manuell identifiziert werden und sind in den obigen Findings enthalten.

---

*Hinweis:* Aufgrund des kritischen Findings (1) kann das Produkt in diesem Zustand nicht ausgeliefert werden. Nach Behebung der Zugriffskontrolle sind die übrigen Punkte im Rahmen eines nächsten Sprints umzusetzen.
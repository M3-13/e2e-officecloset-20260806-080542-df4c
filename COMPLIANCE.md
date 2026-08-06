VERDICT: CHANGES_REQUESTED

## Bericht zur rechtlichen Konformität und Marktreife

### 1. DSGVO (Datenschutz-Grundverordnung)

#### 1.1 Fehlende Account-Löschung (Recht auf Löschung)
- **Schweregrad:** hoch
- **Feststellung:** Die API bietet keinen Endpunkt, mit dem ein Benutzer sein Konto selbst löschen kann. Die Datenschutzerklärung verspricht, dass Daten bei Account-Auflösung gelöscht werden, aber es gibt keinen Weg, dies zu veranlassen. Dies verletzt das Recht auf Löschung nach Art. 17 DSGVO, da Betroffene ihre Daten nicht selbst entfernen können.
- **Abhilfe:** Implementieren Sie einen authentifizierten `DELETE /api/account`-Endpunkt im `backend/auth.py` (Router). Dieser muss alle verknüpften Kleidungsstücke, Outfits, gespeicherten Bilder und den Benutzerdatensatz löschen. Ergänzen Sie im Frontend eine Einstellungsseite mit einem Lösch-Button, oder verlinken Sie eine E‑Mail-Adresse, an die Löschanträge gestellt werden können. Beispiel: `@router.delete("/account", status_code=204)`.

#### 1.2 JWT wird nicht als `HttpOnly`-Cookie gesetzt (Widerspruch zu AC‑25)
- **Schweregrad:** hoch
- **Feststellung:** Die Sprint‑Spec verlangt in **AC‑08**, dass das JWT ausschließlich im `Authorization`-Header übertragen wird, und in **AC‑25**, dass es als `HttpOnly`‑Cookie gesetzt wird. Die aktuelle Implementierung folgt AC‑08 (kein Cookie, `Bearer`-Header). AC‑25 ist nicht erfüllt. Ein rein speicherbasierter Token (wie im `AuthContext`) bietet keinen Schutz gegen Seiten-Neuladen (Auth‑Verlust) und ist bei XSS‑Angriffen gefährdet, da er im JavaScript-Kontext liegt. Im Widerspruch zu AC‑25 leidet die Sicherheitsarchitektur, was ein Datenschutzrisiko darstellt.
- **Abhilfe:** Entscheiden Sie, ob AC‑25 oder AC‑08 Vorrang hat:
  - **Variante A (Cookie-basiert, sicherer):** Backend setzt nach Login ein `HttpOnly`‑Cookie (z. B. `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict`). Das Frontend entfernt die Speicherung im `AuthContext` und sendet den Token nur noch über den Cookie. Der `Authorization`-Header wird nicht mehr genutzt. Dann muss AC‑08 aus der Spec entfernt werden.
  - **Variante B (Header-basiert, aktuell):** Entfernen Sie AC‑25 aus der Spec und dokumentieren Sie, dass der Token nur im Header übertragen wird. Eine Persistenz über `localStorage` sollte aus Sicherheitsgründen vermieden werden (aktuell nicht verwendet). Bei Variante B muss AC‑25 als „nicht implementiert“ gekennzeichnet werden. Beide Varianten sind GDPR‑konform, aber die Spec muss widerspruchsfrei sein.

#### 1.3 Platzhalter in der Datenschutzerklärung
- **Schweregrad:** mittel
- **Feststellung:** In `frontend/src/pages/PrivacyPage.tsx` stehen Platzhalter wie `[Name des Betreibers]`, `[Strasse und Hausnummer]` etc. Das ist für eine Testumgebung akzeptabel, nicht jedoch für den Produktivbetrieb. Ohne vollständige Angaben ist der Verantwortliche nicht identifizierbar.
- **Abhilfe:** Ersetzen Sie alle Platzhalter in `PrivacyPage.tsx` durch die tatsächlichen Kontaktdaten des Betreibers. Gleiches gilt für das Impressum (`ImprintPage.tsx`).

#### 1.4 Unzureichende Protokollierung von Exceptions
- **Schweregrad:** mittel
- **Feststellung:** `backend/main.py` fängt alle Exceptions mit `logger.exception(...)` ab. Dadurch werden der vollständige Stacktrace und der Fehlertext protokolliert. Enthält eine Exception versehentlich personenbezogene Daten (z. B. eine E‑Mail in einer Fehlermeldung), verstößt dies gegen das Logging‑Verbot aus **AC‑23**. Auch ohne PII können Stacktraces sensible interne Strukturen offenbaren.
- **Abhilfe:** Ändern Sie den Handler in `backend/main.py`:
  ```python
  @app.exception_handler(Exception)
  async def unhandled(request: Request, exc: Exception) -> JSONResponse:
      logger.error("unhandled error on %s %s", request.method, request.url.path)
      return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
  ```
  Verwenden Sie `logger.error` ohne `exc_info=True` und ohne die Exception zu übergeben, damit nur die URL protokolliert wird.

### 2. EU Cyber Resilience Act (CRA)

#### 2.1 Fehlende SBOM und Sicherheitsdokumentation
- **Schweregrad:** niedrig
- **Feststellung:** Das Produkt verarbeitet personenbezogene Daten und fällt als SaaS möglicherweise unter die Ausnahme für Fernverarbeitung. Dennoch empfiehlt der CRA grundsätzlich eine SBOM und dokumentierte Sicherheitseigenschaften. Im Repo fehlen eine `SBOM.json` (CycloneDX/SPDX) und eine detaillierte Beschreibung der implementierten Sicherheitsmaßnahmen über die vorhandene `SECURITY.md` hinaus.
- **Abhilfe:** Erzeugen Sie eine Software Bill of Materials (z. B. mit `pip freeze > backend/requirements_run.txt` und `npm list --json > frontend/npm-sbom.json`). Ergänzen Sie in `SECURITY.md` eine Übersicht der umgesetzten Sicherheitsmerkmale (JWT, bcrypt, Rate Limiting, Image Validation, Content Security Policy etc.), damit die Erfüllung der CRA‑Prinzipien nachvollziehbar ist.

### 3. Pflichttexte und Benutzeroberfläche

#### 3.1 Cookie-Hinweis und Consent-Banner
- **Schweregrad:** niedrig
- **Feststellung:** Es werden keine Cookies gesetzt, daher ist kein Consent‑Banner erforderlich. Allerdings fehlt ein sichtbarer Hinweis auf den Einsatz technisch notwendiger Session‑Informationen (falls später hinzugefügt). Der bloße Link zur Datenschutzerklärung im Footer ist akzeptabel, eine explizite Information über nicht gesetzte Cookies könnte das Vertrauen stärken.
- **Abhilfe:** Dies kann in einem späteren Sprint ergänzt werden. Eine nicht-blockierende Option: Einmaligen Hinweis "Diese Website verwendet keine Tracking-Cookies" anzeigen und nach Bestätigung ausblenden.

### 4. Barrierefreiheit (BITV/WCAG)

#### 4.1 Fehlende Barrierefreiheitserklärung und grundlegende Mängel
- **Schweregrad:** mittel
- **Feststellung:** Das Frontend ist eine öffentliche Web‑UI und muss die Anforderungen der Barrierefreiheitsstärkungsgesetzes (BFSG, ab 2025) erfüllen. Es fehlt eine Barrierefreiheitserklärung (z. B. `/accessibility`), und es wurden keine Tests auf Tastaturbedienbarkeit, Screenreader-Kompatibilität oder Farbkontraste durchgeführt.
- **Abhilfe:**
  - Erstellen Sie eine Seite `frontend/src/pages/AccessibilityPage.tsx` mit einer Erklärung und Kontaktmöglichkeit für Feedback.
  - Fügen Sie in `frontend/index.html` einen versteckten Skiplink ein: `<a class="skip-link" href="#main">Zum Inhalt springen</a>`.
  - Stellen Sie sicher, dass interaktive Elemente (Buttons, Links) per Tabulator erreichbar sind und einen sichtbaren Fokusrahmen erhalten (prüfen Sie `outline: none` nirgends verwendet wird).
  - Verwenden Sie für dynamisch eingeblendete Fehlermeldungen `aria-live="polite"` (z. B. in Login- und Registrierungsformularen).
  - Lassen Sie die Farbpalette durch ein Kontrast‑Tool prüfen (insbesondere Gold `#C9A84C` auf Hintergrund `#0F0A0A` kann den Mindestkontrast unterschreiten).
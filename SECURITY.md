VERDICT: CHANGES_REQUESTED

## Sicherheitsbericht

### 1. Zusammenfassung
Das Produkt setzt die meisten Sicherheitsanforderungen (AC‑08 – AC‑28) korrekt um. Es bestehen jedoch zwei Befunde, die eine Nachbesserung empfehlen: die widersprüchliche Token‑Handhabung zwischen AC‑08 und AC‑25 sowie die fehlende Dependency‑Prüfung (kein pip‑audit/npm‑audit‑Ergebnis), was insbesondere die Bildverarbeitungsbibliothek Pillow betrifft. Es wurden **keine** hochriskanten oder kritischen Schwachstellen wie Hardcoded Secrets, Injection, Auth‑Bypass oder ausnutzbare CVEs gefunden.

### 2. Einzelbefunde

#### F‑01: Widerspruch in den Anforderungen AC‑08 ↔ AC‑25 – Token‑Speicherung im Frontend (mittel)
- **Betroffene Anforderung:** AC‑08 („JWT‑Token ausschließlich über Authorization‑Header“) vs. AC‑25 („JWT ausschließlich als HttpOnly‑Cookie“)
- **Betroffene Komponenten:** `backend/auth.py` (Login‑Response ohne Cookie), `frontend/src/contexts/AuthContext.tsx` (Token im React‑State), `frontend/src/api/client.ts` (Token als Modul‑Variable)
- **Beschreibung:**  
  Die Implementierung folgt **AC‑08** und überträgt den JWT ausschließlich im `Authorization`‑Header. Das Token wird im Frontend im JavaScript‑Arbeitsspeicher gehalten und ist damit grundsätzlich durch **XSS‑Angriffe auslesbar**.  
  **AC‑25** verlangt hingegen, das Token ausschließlich als `HttpOnly`‑Cookie zu setzen und so vor clientseitigem Zugriff zu schützen.  
  Beide Anforderungen schließen sich gegenseitig aus und können nicht gleichzeitig erfüllt werden.
- **Risiko:** Ein erfolgreicher XSS‑Angriff könnte das Token aus dem JavaScript‑State stehlen (session hijacking). Aktuell ist keine konkrete XSS‑Lücke im Code ersichtlich; React schützt durch automatisches Escaping, und die CSP (`default-src 'self'`) verringert das Risiko weiter. Dennoch bleibt die Angriffsfläche im Vergleich zur `HttpOnly`‑Variante erhöht.
- **Empfehlung:**  
  1. Die widersprüchlichen Anforderungen mit den Architekten klären.  
  2. Wenn AC‑25 höher priorisiert wird: Umbau auf `HttpOnly`‑Cookie (z. B. `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax`) **und gleichzeitiges Ändern von AC‑08**. Die Backend‑Endpunkte müssten dann das Token aus dem Cookie lesen und den `Authorization`‑Header ignorieren.  
  3. Falls AC‑08 beibehalten wird, sollte AC‑25 gestrichen und das Restrisiko in der Dokumentation festgehalten werden.  
  4. Unabhängig davon CSP weiterhin strikt halten und regelmäßig auf XSS‑Potenzial im Frontend prüfen.

#### F‑02: Fehlende Dependency‑Prüfung – Risiko durch veraltetes Pillow (mittel)
- **Betroffene Komponente:** `backend/image_utils.py`, `backend/requirements.txt` (Pillow‑Version nicht im Audit)
- **Beschreibung:**  
  Die Scanner **pip‑audit** und **semgrep** wurden nicht ausgeführt (`[skipped]`). Daher kann keine Aussage über die Sicherheit der installierten Python‑Pakete getroffen werden.  
  Besonders kritisch ist die Bildverarbeitungsbibliothek **Pillow**, die mehrfach in `image_utils.py` verwendet wird. Ältere Pillow‑Versionen wiesen schwerwiegende Sicherheitslücken auf (z. B. CVE‑2022‑22817, CVE‑2023‑44271), die bei Verarbeitung präparierter Bilddateien zu **Speicherkorruption und potenziellem RCE** führen können.
- **Risiko:** Ohne konkreten Versions‑Scan ist das Risiko nicht quantifizierbar; im Worst‑Case kann ein Angreifer über einen manipulierten Bild‑Upload die Server‑Instanz kompromittieren.
- **Empfehlung:**  
  1. **pip‑audit** oder eine gleichwertige Abhängigkeitsanalyse in die CI‑Pipeline integrieren und das Ergebnis diesem Bericht beifügen.  
  2. Mindestens Pillow auf die aktuellste stabile Version aktualisieren (`>=10.0.0`).  
  3. Langfristige Aktualisierungsstrategie (Renovate/Dependabot) etablieren.

### 3. Einhaltung der restlichen Security‑/Datenschutz‑ACs
Die folgenden Anforderungen wurden erfolgreich umgesetzt:
- **AC‑03,04,05,06:** Garderobe und Outfit‑Creator funktionieren mit den erforderlichen Zugriffskontrollen.
- **AC‑07:** Nicht authentifizierte Besucher werden auf `/login` umgeleitet (`ProtectedRoute`).
- **AC‑09:** JWT‑Secret aus `RUN.json` / Environment – kein fester Wert im Code.
- **AC‑10, AC‑27:** Besitzerprüfung per `user_id`; fremde IDs liefern `404`.
- **AC‑11:** Mindestlänge 8 Zeichen bei Registrierung.
- **AC‑12:** bcrypt‑Hashing (`$2b$`‑Prefix) mit automatischem Salt.
- **AC‑13:** Ratenbegrenzung: max. 10 fehlgeschlagene Login‑Versuche / IP / Minute.
- **AC‑14:** Token‑Gültigkeit 60 Minuten.
- **AC‑15:** Magic‑Byte‑Validierung für JPEG/PNG.
- **AC‑16:** UUID‑basierte Dateinamen.
- **AC‑17:** Generische Fehlerantworten, keine Stacktraces.
- **AC‑18:** SQLite‑Datenbank nicht im Repo, Pfad über `DATABASE_PATH`.
- **AC‑20:** Alle API‑Responses mit `Content-Type: application/json`.
- **AC‑21:** CSP‑Header wird für `text/html`‑Responses gesetzt.
- **AC‑22:** `X-Content-Type-Options: nosniff` auf allen statischen Ressourcen.
- **AC‑23:** Keine Protokollierung von E‑Mails, Passwörtern oder JWT‑Secrets.
- **AC‑24:** Hash erfüllt bcrypt‑Format und pro‑Set‑Salt (durch bcrypt intern).
- **AC‑26:** EXIF‑Metadaten werden vor Speicherung entfernt.
- **AC‑28:** Keine nicht‑funktionalen Cookies oder externe Tracker.

### 4. Zusammenfassung der Empfehlungen
1. **Konflikt AC‑08 / AC‑25** klären und einheitliche, sichere Token‑Handhabung implementieren (entweder reines HttpOnly‑Cookie oder Authorization‑Header mit dokumentiertem XSS‑Restrisiko).
2. **Dependency‑Scan** aktivieren und Pillow aktualisieren.
3. Weitere Empfehlungen:  
   - Optional: CSRF‑Schutz für die API hinzufügen, falls künftig Cookies verwendet werden.  
   - Optional: Refresh‑Token‑Mechanismus einführen, um die Session‑Lebensdauer benutzerfreundlich zu gestalten, ohne die Sicherheit zu kompromittieren.

Das Produkt kann nach Klärung dieser Punkte als sicher gelten.
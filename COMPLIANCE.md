VERDICT: BLOCKED

## Strukturierte rechtliche Prüfung des Sprints

### 1. Datenschutz-Grundverordnung (DSGVO)

#### 1.1 Fehlende Datenschutzerklärung – Informationspflicht nach Art. 13
**Schweregrad:** kritisch  
**Fundstelle:** gesamte Codebasis (kein Privacy-Hinweis vorhanden)  
**Problem:** Die Anwendung verarbeitet personenbezogene Daten (E-Mail-Adresse, Passwort-Hash, hochgeladene Bilder) von registrierten Nutzern. Es existiert keinerlei Datenschutzerklärung, die die betroffene Person über Art, Umfang, Zwecke, Rechtsgrundlagen, Speicherdauer und ihre Rechte informiert. Dies verstößt gegen die Informationspflichten aus Art. 13 DSGVO und macht die Verarbeitung unrechtmäßig.  
**Abhilfe:**  
- Erstellen Sie eine Datenschutzerklärung als eigene Seite (z. B. `/privacy`) und hinterlegen Sie sie im Frontend.  
- Fügen Sie einen gut sichtbaren Link im Footer oder während des Registrierungsprozesses hinzu.  
- Die Erklärung muss mindestens enthalten: Verantwortlicher, Kontaktdaten des Datenschutzbeauftragten, Zwecke und Rechtsgrundlagen der Verarbeitung, Kategorien personenbezogener Daten, Empfänger, Übermittlungen in Drittländer, Speicherdauer, Betroffenenrechte, Beschwerderecht bei einer Aufsichtsbehörde.

#### 1.2 JWT-Cookie trotz Vorgabe „Authorization-Header only“ (AC-08) widerspricht Sicherheits- und Datenschutzzielen
**Schweregrad:** hoch  
**Fundstelle:** `backend/auth.py`, Zeile `response.set_cookie("access_token", …)`  
**Problem:** Der Login-Endpunkt setzt ein `HttpOnly`-Cookie mit dem JWT. Dies ist nicht erforderlich und widerspricht AC-08 („JWT-Token werden ausschließlich über den Authorization-Header übertragen“). Das Cookie erhöht die Angriffsfläche (z. B. CSRF, versehentliches Logging), ohne dass es vom Client jemals ausgewertet wird. Zudem ist `secure=False` gesetzt, was im Produktivbetrieb ein Sicherheitsrisiko darstellt.  
**Abhilfe:**  
- Entfernen Sie den `response.set_cookie`-Block in `backend/auth.py:79–84`.  
- Stellen Sie sicher, dass der Client das Token ausschließlich über den `Authorization`-Header sendet (dies ist bereits der Fall).

#### 1.3 Unkontrollierte Datenübermittlung an Google durch externe Fonts
**Schweregrad:** mittel  
**Fundstelle:** `frontend/index.html`, Zeile 11–13 (Google Fonts CSS)  
**Problem:** Das Frontend bindet Schriftarten von `fonts.googleapis.com` und `fonts.gstatic.com` ein. Ohne Einwilligung werden bei jedem Seitenaufruf personenbezogene Daten (mindestens die IP-Adresse) an einen Drittanbieter übermittelt. Dies ist nicht durch eine Rechtsgrundlage gedeckt und verstößt gegen Art. 6 DSGVO. Zudem blockiert die aktuelle Content-Security-Policy (`default-src 'self'`) das Laden der Schriften – die Einbindung ist daher ohnehin wirkungslos oder würde zu Layoutfehlern führen.  
**Abhilfe:**  
- Hosting der Schriftarten lokal: Laden Sie die benötigten Font-Dateien herunter, legen Sie sie in `frontend/src/assets/fonts/` ab und definieren Sie `@font-face`-Regeln in `frontend/src/index.css`.  
- Entfernen Sie die externen `<link>`-Tags aus `index.html`.  
- Passen Sie die CSP in `backend/security.py` an: `font-src 'self'` hinzufügen.

#### 1.4 Logging von Request-Informationen (geringes Risiko)
**Schweregrad:** niedrig  
**Fundstelle:** `backend/main.py`, `logger.exception(…)` im globalen Exception-Handler  
**Problem:** Der Handler loggt Methode und Pfad der Anfrage. Dies könnte in Kombination mit Server-Logs, die IP-Adressen enthalten, eine indirekte Identifizierung ermöglichen. Eine explizite Protokollierung von E‑Mails, Passwörtern oder Token findet nicht statt – AC-23 ist insoweit erfüllt.  
**Abhilfe:**  
- Optional: Im Produktivbetrieb sicherstellen, dass das Logging keine IP-Adressen oder User-Agent-Strings erfasst, oder die Logs nach einem angemessenen Zeitraum löschen.

### 2. EU Cyber Resilience Act (CRA)
**Relevanz:** Nicht anwendbar.  
Die Anwendung ist ein reiner Onlinedienst (Web-App) und wird nicht als Produkt mit digitalen Elementen in Verkehr gebracht. Die CRA-Anforderungen an SBOM, Schwachstellenmanagement und sichere Entwicklung sind nicht verpflichtend, auch wenn sie als Best Practise sinnvoll sein können. Keine Beanstandungen.

### 3. EU AI Act
Keine KI-Funktionalität erkennbar. Keine Prüfung erforderlich.

### 4. Pflichttexte & UI (Impressum, Cookie, Rechtstexte)

#### 4.1 Fehlendes Impressum (nach DDG / TMG)
**Schweregrad:** kritisch  
**Fundstelle:** gesamtes Frontend  
**Problem:** Für geschäftsmäßig betriebene Telemedien ist ein Impressum mit Name, Anschrift und weiteren Pflichtangaben zwingend vorgeschrieben. Es fehlt vollständig. Dies stellt einen klaren Rechtsverstoß dar, der ein sofortiges Markthindernis bildet.  
**Abhilfe:**  
- Erstellen Sie eine Impressumsseite (z. B. `/imprint`) als React-Komponente und Route.  
- Platzieren Sie einen Link im Footer, der auf jeder Seite erreichbar ist.  
- Die Impressumspflicht gilt für den Betreiber des Dienstes; die Inhalte sind außerhalb des Codes zu definieren, aber die technische Bereitstellung muss gewährleistet sein.

#### 4.2 Fehlende Cookie-Information
**Schweregrad:** hoch  
**Fundstelle:** gesamte Anwendung  
**Problem:** Obwohl nur ein technisch notwendiges Cookie (authentifizierung) gesetzt werden darf, muss der Nutzer hierüber in der Datenschutzerklärung informiert werden. Ein Cookie-Banner ist bei rein notwendigen Cookies entbehrlich, aber aufgrund der Transparenzpflicht muss die Datenschutzerklärung die verwendeten Cookies beschreiben.  
**Abhilfe:**  
- Ergänzung in der Datenschutzerklärung: Nennung des Cookies, Zweck, Speicherdauer, Hinweis auf die Unerlässlichkeit für den Login.

### 5. Barrierefreiheit (WCAG / BITV / EAA)

#### 5.1 Keine Accessibility-Prüfung oder -Umsetzung erkennbar
**Schweregrad:** hoch  
**Fundstelle:** gesamtes Frontend  
**Problem:** Die Anwendung muss nach den Anforderungen der WCAG 2.1 (Level AA) und dem European Accessibility Act barrierefrei sein, sofern sie an Verbraucher gerichtet ist. Es sind weder Tests noch spezifische Maßnahmen (ARIA-Labels, ausreichender Farbkontrast, Tastaturbedienbarkeit, Screenreader-Tauglichkeit) implementiert.  
**Abhilfe:**  
- Führen Sie ein automatisiertes Accessibility-Audit (z. B. mit axe DevTools oder Lighthouse) durch und beheben Sie kritische Fehler (z. B. fehlende Alternativtexte für Bilder, unzureichende Kontraste).  
- Mindestens:  
  - Alle Grafiken erhalten ein sinnvolles `alt`-Attribut.  
  - Formularfelder sind mit eindeutigen `<label>`-Elementen verknüpft.  
  - Die Farbpalette (dunkler Hintergrund, rote/goldene Akzente) wird auf ausreichendes Kontrastverhältnis (4,5:1 für Normaltext, 3:1 für große Texte) überprüft und ggf. angepasst.  
- Integration eines Accessibility-Checks in die CI-Pipeline wird empfohlen.

### Fazit
Das Produkt weist mindestens zwei kritische Rechtsverstöße auf – das Fehlen eines Impressums und das Fehlen einer Datenschutzerklärung. Ohne diese Informationen ist die Verarbeitung personenbezogener Daten nicht DSGVO‑konform und der Marktzugang ist nicht zulässig. Die Blockade ist daher unumgänglich. Nach Behebung der kritischen Punkte sowie der weiteren mittleren und hohen Beanstandungen kann eine Neubewertung erfolgen.
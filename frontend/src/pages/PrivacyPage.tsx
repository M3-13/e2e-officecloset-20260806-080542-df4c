const LEGAL_PAGE_CSS = `
.legal-page {
  max-width: 860px;
}

.legal-page__card {
  background: var(--color-bg_card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-7);
  animation: slideUp 0.4s ease;
}

.legal-page__title {
  font-family: var(--font-family-heading);
  font-size: var(--size-3xl);
  color: var(--color-gold);
  margin-bottom: var(--space-2);
}

.legal-page__updated {
  font-size: var(--size-sm);
  color: var(--color-fg_muted);
  margin-bottom: var(--space-7);
}

.legal-page__section {
  margin-bottom: var(--space-6);
}

.legal-page__section:last-child {
  margin-bottom: 0;
}

.legal-page__section-title {
  font-family: var(--font-family-heading);
  font-size: var(--size-xl);
  color: var(--color-gold);
  margin-bottom: var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.legal-page__section-title--sub {
  font-family: var(--font-family-heading);
  font-size: var(--size-lg);
  color: var(--color-fg);
  margin-bottom: var(--space-1);
  margin-top: var(--space-2);
}

.legal-page p {
  color: var(--color-fg_muted);
  line-height: 1.7;
  margin-bottom: var(--space-2);
}

.legal-page__list {
  color: var(--color-fg_muted);
  line-height: 1.7;
  padding-left: var(--space-5);
  margin-bottom: var(--space-2);
}

.legal-page__list li {
  margin-bottom: var(--space-1);
}

.legal-page strong {
  color: var(--color-fg);
}

@media (max-width: 1024px) {
  .legal-page__card {
    padding: var(--space-6) var(--space-5);
  }
}

@media (max-width: 640px) {
  .legal-page__card {
    padding: var(--space-5) var(--space-4);
  }

  .legal-page__title {
    font-size: var(--size-2xl);
  }

  .legal-page__section-title {
    font-size: var(--size-lg);
  }
}
`;

export default function PrivacyPage() {
  return (
    <>
      <style>{LEGAL_PAGE_CSS}</style>
      <div className="page-container legal-page">
        <article className="legal-page__card">
          <h1 className="legal-page__title">Datenschutzerklaerung</h1>
          <p className="legal-page__updated">Stand: August 2026</p>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">1. Verantwortlicher</h2>
            <p>
              <strong>Red Carpet Wardrobe</strong>
              <br />
              [Name des Betreibers]
              <br />
              [Strasse und Hausnummer]
              <br />
              [PLZ und Ort]
              <br />
              [Land]
              <br />
              E-Mail: [E-Mail-Adresse]
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              2. Zwecke und Rechtsgrundlagen der Verarbeitung
            </h2>
            <p>
              Wir verarbeiten personenbezogene Daten ausschliesslich zu den
              folgenden Zwecken und auf Basis der genannten Rechtsgrundlagen
              nach der Datenschutz-Grundverordnung (DSGVO):
            </p>

            <h3 className="legal-page__section-title--sub">
              2.1 Vertragserfuellung (Art. 6 Abs. 1 lit. b DSGVO)
            </h3>
            <p>
              Die Verarbeitung Ihrer Daten ist erforderlich, um Ihnen die
              Nutzung der Red Carpet Wardrobe-Plattform zu ermoeglichen:
              Registrierung und Verwaltung Ihres Kontos, Speicherung und
              Verwaltung Ihrer Kleidungsstuecke und Outfits, sowie der Upload
              und die Anzeige von Bildern Ihrer Garderobe.
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              3. Kategorien personenbezogener Daten
            </h2>
            <p>Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
            <ul className="legal-page__list">
              <li>
                <strong>E-Mail-Adresse</strong> &mdash; zur Identifikation
                Ihres Kontos und fuer die Kommunikation im Rahmen der
                Vertragserfuellung.
              </li>
              <li>
                <strong>Passwort-Hash</strong> &mdash; Ihr Passwort wird
                ausschliesslich als kryptographischer Hash gespeichert. Das
                Klartext-Passwort ist uns zu keinem Zeitpunkt bekannt.
              </li>
              <li>
                <strong>Hochgeladene Bilder</strong> &mdash; Fotos Ihrer
                Kleidungsstuecke, die Sie im Rahmen der Garderoben-Verwaltung
                selbst hochladen. Metadaten (EXIF) werden vor der Speicherung
                automatisch entfernt.
              </li>
            </ul>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              4. Empfaenger personenbezogener Daten
            </h2>
            <p>
              Wir geben Ihre personenbezogenen Daten <strong>nicht</strong> an
              Dritte weiter. Eine Uebermittlung an externe Dienstleister oder
              in Drittlaender findet nicht statt. Ihre Daten verbleiben
              ausschliesslich auf unseren Systemen.
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">5. Speicherdauer</h2>
            <p>
              Ihre personenbezogenen Daten werden gespeichert, solange Ihr
              Konto bei Red Carpet Wardrobe besteht. Mit der Loeschung Ihres
              Accounts werden saemtliche mit Ihrem Konto verbundenen Daten
              unwiderruflich geloescht &mdash; einschliesslich aller
              Kleidungsstuecke, Outfits und hochgeladener Bilder.
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              6. Betroffenenrechte
            </h2>
            <p>
              Ihnen stehen als betroffene Person folgende Rechte nach der
              DSGVO zu:
            </p>
            <ul className="legal-page__list">
              <li>
                <strong>Auskunft</strong> (Art. 15 DSGVO) &mdash; Sie koennen
                Auskunft ueber die zu Ihrer Person gespeicherten Daten
                verlangen.
              </li>
              <li>
                <strong>Berichtigung</strong> (Art. 16 DSGVO) &mdash; Sie
                koennen die Berichtigung unrichtiger Daten verlangen.
              </li>
              <li>
                <strong>Loeschung</strong> (Art. 17 DSGVO) &mdash; Sie koennen
                die Loeschung Ihrer Daten verlangen (insbesondere durch
                Loeschung Ihres Accounts).
              </li>
              <li>
                <strong>Einschraenkung der Verarbeitung</strong> (Art. 18
                DSGVO) &mdash; Sie koennen unter bestimmten Voraussetzungen
                die Einschraenkung der Verarbeitung verlangen.
              </li>
              <li>
                <strong>Datenuebertragbarkeit</strong> (Art. 20 DSGVO) &mdash;
                Sie koennen Ihre Daten in einem strukturierten, gaengigen und
                maschinenlesbaren Format erhalten.
              </li>
              <li>
                <strong>Widerspruch</strong> (Art. 21 DSGVO) &mdash; Sie
                koennen aus Gruenden, die sich aus Ihrer besonderen Situation
                ergeben, der Verarbeitung Ihrer Daten widersprechen.
              </li>
            </ul>
            <p>
              Zur Ausuebung Ihrer Rechte wenden Sie sich bitte an die oben
              unter &bdquo;Verantwortlicher&rdquo; angegebene E-Mail-Adresse.
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              7. Beschwerderecht bei der Aufsichtsbehoerde
            </h2>
            <p>
              Ihnen steht ein Beschwerderecht bei der zustaendigen
              Datenschutz-Aufsichtsbehoerde zu (Art. 77 DSGVO). Die fuer uns
              zustaendige Aufsichtsbehoerde ist der Landesdatenschutzbeauftragte
              des Bundeslandes, in dem der Verantwortliche seinen Sitz hat.
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              8. Cookies und aehnliche Technologien
            </h2>
            <p>
              Red Carpet Wardrobe verwendet einen einzelnen technisch
              notwendigen Cookie:
            </p>
            <ul className="legal-page__list">
              <li>
                <strong>Auth-Cookie (Session-Cookie)</strong> &mdash; Zweck:
                Sitzungsverwaltung fuer Ihren authentifizierten Zugang zur
                Plattform. Ohne diesen Cookie ist eine Anmeldung und die
                Nutzung der geschuetzten Bereiche nicht moeglich.
              </li>
            </ul>
            <p>
              <strong>Speicherdauer:</strong> Der Auth-Cookie wird nach 60
              Minuten Inaktivitaet automatisch ungueltig (Session-Timeout).
              Eine laengerfristige Speicherung oder Verfolgung ueber Sitzungen
              hinweg findet nicht statt. Es werden keine Tracking-, Marketing-
              oder Analyse-Cookies eingesetzt.
            </p>
            <p>
              Die Rechtsgrundlage fuer den Einsatz des technisch notwendigen
              Cookies ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfuellung), da
              die Sitzungsverwaltung fuer die Bereitstellung des Dienstes
              zwingend erforderlich ist. Eine Einwilligung ist hierfuer nicht
              erforderlich (&sect; 25 Abs. 2 Nr. 2 TTDSG).
            </p>
          </section>
        </article>
      </div>
    </>
  );
}

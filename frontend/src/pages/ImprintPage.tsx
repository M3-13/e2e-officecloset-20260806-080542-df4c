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
  margin-bottom: var(--space-6);
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
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.legal-page p {
  color: var(--color-fg_muted);
  line-height: 1.7;
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

export default function ImprintPage() {
  return (
    <>
      <style>{LEGAL_PAGE_CSS}</style>
      <div className="page-container legal-page">
        <article className="legal-page__card">
          <h1 className="legal-page__title">Impressum</h1>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              Angaben gemaess &sect; 5 TMG
            </h2>
            <p>
              <strong>Red Carpet Wardrobe</strong>
            </p>
            <p>
              [Name des Betreibers]
              <br />
              [Strasse und Hausnummer]
              <br />
              [PLZ und Ort]
              <br />
              [Land]
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              Kontakt
            </h2>
            <p>
              <strong>E-Mail:</strong> [E-Mail-Adresse]
            </p>
            <p>
              <strong>Telefon:</strong> [Telefonnummer]
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              Verantwortlich fuer den Inhalt nach &sect; 55 Abs. 2 RStV
            </h2>
            <p>
              [Name des Betreibers]
              <br />
              [Anschrift wie oben]
            </p>
          </section>

          <section className="legal-page__section">
            <h2 className="legal-page__section-title">
              Haftungsausschluss
            </h2>
            <p>
              Die Inhalte dieser Website werden mit groesstmoeglicher Sorgfalt
              erstellt. Der Anbieter uebernimmt jedoch keine Gewaehr fuer die
              Richtigkeit, Vollstaendigkeit und Aktualitaet der
              bereitgestellten Inhalte.
            </p>
          </section>
        </article>
      </div>
    </>
  );
}

import { Link } from 'react-router-dom';

const FOOTER_CSS = `
.footer {
  background: var(--color-bg_card);
  border-top: 1px solid var(--color-border);
  padding: var(--space-5) var(--space-6);
  margin-top: auto;
}

.footer__inner {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.footer__brand {
  font-family: var(--font-family-heading);
  font-size: var(--size-sm);
  color: var(--color-fg_muted);
}

.footer__links {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.footer__link {
  font-family: var(--font-family);
  font-size: var(--size-sm);
  color: var(--color-fg_muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer__link:hover {
  color: var(--color-gold);
}

.footer__separator {
  color: var(--color-border);
  font-size: var(--size-sm);
  user-select: none;
}

@media (max-width: 640px) {
  .footer {
    padding: var(--space-4) var(--space-3);
  }

  .footer__inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-2);
  }

  .footer__links {
    gap: var(--space-3);
  }
}
`;

export default function Footer() {
  return (
    <>
      <style>{FOOTER_CSS}</style>
      <footer className="footer">
        <div className="footer__inner">
          <span className="footer__brand">
            &copy; {new Date().getFullYear()} Red Carpet Wardrobe
          </span>
          <nav className="footer__links" aria-label="Rechtliche Informationen">
            <Link to="/privacy" className="footer__link">
              Datenschutz
            </Link>
            <span className="footer__separator" aria-hidden="true">
              |
            </span>
            <Link to="/imprint" className="footer__link">
              Impressum
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

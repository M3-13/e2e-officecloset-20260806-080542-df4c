import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AUTH_CSS = `
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px);
  padding-top: var(--space-6);
  padding-bottom: var(--space-6);
}

.auth-form {
  width: 100%;
  max-width: 440px;
  background: var(--color-bg_card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-7) var(--space-6);
  animation: fadeInScale 0.4s ease;
}

.auth-form__header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.auth-form__star {
  font-size: 2rem;
  color: var(--color-gold);
  margin-bottom: var(--space-2);
}

.auth-form__title {
  font-family: var(--font-family-heading);
  font-size: var(--size-2xl);
  color: var(--color-gold);
  margin-bottom: var(--space-1);
}

.auth-form__subtitle {
  color: var(--color-fg_muted);
  font-size: var(--size-sm);
}

.auth-form__group {
  margin-bottom: var(--space-4);
}

.auth-form__label {
  display: block;
  font-size: var(--size-sm);
  font-weight: 500;
  color: var(--color-fg);
  margin-bottom: var(--space-1);
}

.auth-form__input {
  width: 100%;
  background: var(--color-bg_input);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-family);
  font-size: var(--size-base);
  min-height: 48px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-form__input::placeholder {
  color: var(--color-fg_muted);
}

.auth-form__input:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
}

.auth-form__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-form__button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gold);
  color: var(--color-bg);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-family);
  font-size: var(--size-base);
  font-weight: 600;
  letter-spacing: 0.03em;
  min-height: 48px;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: var(--space-5);
}

.auth-form__button:hover:not(:disabled) {
  background: var(--color-gold_light);
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.45);
}

.auth-form__button:active:not(:disabled) {
  transform: scale(0.97);
}

.auth-form__button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.auth-form__error {
  background: rgba(224, 85, 85, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--size-sm);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-4);
  text-align: center;
}

.auth-form__footer {
  text-align: center;
  margin-top: var(--space-5);
  color: var(--color-fg_muted);
  font-size: var(--size-sm);
}

@media (max-width: 640px) {
  .auth-form {
    padding: var(--space-5) var(--space-4);
  }
}
`;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/wardrobe');
    } catch {
      setError('Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{AUTH_CSS}</style>
      <div className="page-container auth-page">
        <div className="auth-form">
          <div className="auth-form__header">
            <div className="auth-form__star">&#9733;</div>
            <h1 className="auth-form__title">Anmeldung</h1>
            <p className="auth-form__subtitle">
              Willkommen zurück auf dem Red Carpet
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-form__error" role="alert">
                {error}
              </div>
            )}

            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="login-email">
                E-Mail
              </label>
              <input
                id="login-email"
                className="auth-form__input"
                type="email"
                autoComplete="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="login-password">
                Passwort
              </label>
              <input
                id="login-password"
                className="auth-form__input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-form__button"
              disabled={loading}
            >
              {loading ? 'Wird angemeldet …' : 'Anmelden'}
            </button>
          </form>

          <p className="auth-form__footer">
            Noch kein Konto?{' '}
            <Link to="/register">Jetzt registrieren</Link>
          </p>
        </div>
      </div>
    </>
  );
}

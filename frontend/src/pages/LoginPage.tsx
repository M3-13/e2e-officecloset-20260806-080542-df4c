import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AUTH_FORM_CSS from '../styles/authFormStyles';

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
      <style>{AUTH_FORM_CSS}</style>
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

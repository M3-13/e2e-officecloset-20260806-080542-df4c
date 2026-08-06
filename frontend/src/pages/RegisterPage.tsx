import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AUTH_FORM_CSS from '../styles/authFormStyles';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (password.length < 8) {
      return 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    }
    if (password !== confirmPassword) {
      return 'Die Passwörter stimmen nicht überein.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate('/wardrobe');
    } catch {
      setError('Registrierung fehlgeschlagen');
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
            <h1 className="auth-form__title">Registrierung</h1>
            <p className="auth-form__subtitle">
              Betreten Sie den Red Carpet Ihrer persönlichen Garderobe
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-form__error" role="alert">
                {error}
              </div>
            )}

            <div className="auth-form__group">
              <label className="auth-form__label" htmlFor="register-email">
                E-Mail
              </label>
              <input
                id="register-email"
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
              <label className="auth-form__label" htmlFor="register-password">
                Passwort
              </label>
              <input
                id="register-password"
                className="auth-form__input"
                type="password"
                autoComplete="new-password"
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="auth-form__group">
              <label
                className="auth-form__label"
                htmlFor="register-confirm-password"
              >
                Passwort wiederholen
              </label>
              <input
                id="register-confirm-password"
                className="auth-form__input"
                type="password"
                autoComplete="new-password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="auth-form__button"
              disabled={loading}
            >
              {loading ? 'Konto wird erstellt …' : 'Registrieren'}
            </button>
          </form>

          <p className="auth-form__footer">
            Bereits ein Konto?{' '}
            <Link to="/login">Jetzt anmelden</Link>
          </p>
        </div>
      </div>
    </>
  );
}

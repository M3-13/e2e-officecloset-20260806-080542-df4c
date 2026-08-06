import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getOutfits, deleteOutfit } from '../api/client';
import type { OutfitResponse } from '../api/client';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const CSS = `
@keyframes of-spin {
  to { transform: rotate(360deg); }
}

.of-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--space-4);
}

.of-loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: of-spin 0.8s linear infinite;
}

.of-loading__text {
  color: var(--color-fg_muted);
  font-size: var(--size-lg);
}

.of-error {
  text-align: center;
  padding: var(--space-9) var(--space-5);
  animation: slideUp 0.4s ease;
}

.of-error__title {
  font-family: var(--font-family-heading);
  font-size: var(--size-2xl);
  color: var(--color-error);
  margin-bottom: var(--space-3);
}

.of-error__text {
  color: var(--color-fg_muted);
  font-size: var(--size-lg);
}

.of-title {
  font-family: var(--font-family-heading);
  font-size: var(--size-3xl);
  color: var(--color-gold);
  margin-bottom: var(--space-6);
  animation: slideUp 0.35s ease;
}

.of-error-banner {
  background: rgba(224, 85, 85, 0.08);
  border: 1px solid rgba(224, 85, 85, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  color: var(--color-error);
  font-size: var(--size-sm);
  margin-bottom: var(--space-4);
  animation: fadeIn 0.3s ease;
}

.of-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  animation: slideUp 0.4s ease;
}

.of-empty__icon {
  font-size: 3.5rem;
  color: var(--color-gold);
  margin-bottom: var(--space-5);
  animation: fadeInScale 0.5s ease-out;
}

.of-empty__title {
  font-family: var(--font-family-heading);
  font-size: var(--size-3xl);
  color: var(--color-gold);
  margin-bottom: var(--space-3);
}

.of-empty__text {
  color: var(--color-fg_muted);
  font-size: var(--size-lg);
  margin-bottom: var(--space-6);
  max-width: 400px;
}

.of-empty__link {
  display: inline-block;
  background: var(--color-gold);
  color: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 12px 28px;
  font-family: var(--font-family);
  font-size: var(--size-base);
  font-weight: 600;
  letter-spacing: 0.03em;
  min-height: 48px;
  text-decoration: none;
  transition: all 0.25s ease;
}

.of-empty__link:hover {
  background: var(--color-gold_light);
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.45);
  color: var(--color-bg);
}

.of-empty__link:active {
  transform: scale(0.97);
}

.of-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  animation: fadeIn 0.4s ease;
}

.of-card {
  background: var(--color-bg_card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.of-card:hover {
  border-color: var(--color-gold);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 168, 76, 0.3);
  transform: translateY(-2px);
}

.of-card__thumbs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-3);
  padding-bottom: var(--space-1);
  align-items: center;
  min-height: 80px;
}

.of-card__thumb {
  width: 64px;
  height: 85px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.of-card__more {
  font-size: var(--size-xs);
  color: var(--color-fg_muted);
  background: rgba(201, 168, 76, 0.1);
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.of-card__no-items {
  font-size: var(--size-sm);
  color: var(--color-fg_muted);
}

.of-card__body {
  padding: 0 var(--space-3) var(--space-3);
}

.of-card__name {
  font-family: var(--font-family-heading);
  font-size: var(--size-lg);
  color: var(--color-fg);
  margin-bottom: var(--space-0);
}

.of-card__date {
  font-size: var(--size-xs);
  color: var(--color-fg_muted);
}

.of-card__delete {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: var(--color-fg_muted);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--size-sm);
  transition: all 0.2s ease;
  opacity: 0;
}

.of-card:hover .of-card__delete {
  opacity: 1;
}

.of-card__delete:hover {
  background: var(--color-error);
  color: var(--color-fg);
}

.of-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--space-5);
  animation: fadeIn 0.2s ease;
}

.of-modal {
  background: var(--color-bg_card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  max-width: 640px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7);
  animation: fadeInScale 0.25s ease-out;
}

.of-modal--confirm {
  max-width: 440px;
}

.of-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.of-modal__title {
  font-family: var(--font-family-heading);
  font-size: var(--size-2xl);
  color: var(--color-gold);
  line-height: 1.2;
}

.of-modal__close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-fg_muted);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--size-lg);
  transition: all 0.2s ease;
}

.of-modal__close:hover {
  color: var(--color-fg);
  border-color: var(--color-gold);
}

.of-modal__date {
  font-size: var(--size-sm);
  color: var(--color-fg_muted);
  margin-bottom: var(--space-5);
}

.of-modal__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-3);
}

.of-modal__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.of-modal__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.of-modal__item-info {
  text-align: center;
}

.of-modal__item-name {
  display: block;
  font-size: var(--size-sm);
  color: var(--color-fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.of-modal__item-cat {
  display: block;
  font-size: var(--size-xs);
  color: var(--color-fg_muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.of-modal__confirm-text {
  color: var(--color-fg_muted);
  font-size: var(--size-base);
  margin-bottom: var(--space-5);
  line-height: 1.6;
}

.of-modal__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.of-modal__btn {
  padding: 10px 26px;
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-size: var(--size-base);
  font-weight: 600;
  min-height: 48px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.of-modal__btn--cancel {
  background: transparent;
  color: var(--color-gold);
  border: 1px solid var(--color-gold);
}

.of-modal__btn--cancel:hover {
  background: rgba(201, 168, 76, 0.12);
}

.of-modal__btn--danger {
  background: var(--color-accent);
  color: var(--color-fg);
  border: none;
}

.of-modal__btn--danger:hover {
  background: var(--color-accent_hover);
  box-shadow: 0 4px 20px rgba(178, 34, 52, 0.45);
}

.of-modal__btn--danger:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .of-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 640px) {
  .of-title {
    font-size: var(--size-2xl);
  }
  .of-grid {
    grid-template-columns: 1fr;
  }
  .of-modal {
    padding: var(--space-5);
  }
  .of-modal__items {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .of-modal__actions {
    flex-direction: column;
  }
  .of-modal__btn {
    width: 100%;
    text-align: center;
  }
}
`;

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<OutfitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOutfit, setDetailOutfit] = useState<OutfitResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const loadOutfits = useCallback(() => {
    setLoading(true);
    setError(null);
    getOutfits()
      .then((data) => {
        setOutfits(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Outfits');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOutfits();
  }, [loadOutfits]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await deleteOutfit(id);
      setOutfits((prev) => prev.filter((o) => o.id !== id));
      if (detailOutfit?.id === id) {
        setDetailOutfit(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const openDetail = (outfit: OutfitResponse) => {
    setDetailOutfit(outfit);
  };

  const closeDetail = () => {
    setDetailOutfit(null);
  };

  if (loading) {
    return (
      <div className="page-container">
        <style>{CSS}</style>
        <div className="of-loading">
          <div className="of-loading__spinner" />
          <p className="of-loading__text">Outfits werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error && outfits.length === 0) {
    return (
      <div className="page-container">
        <style>{CSS}</style>
        <div className="of-error">
          <h2 className="of-error__title">Fehler</h2>
          <p className="of-error__text">{error}</p>
        </div>
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="page-container">
        <style>{CSS}</style>
        <div className="of-empty">
          <div className="of-empty__icon">&#9733;</div>
          <h1 className="of-empty__title">Noch keine Outfits</h1>
          <p className="of-empty__text">
            Kreiere deinen ersten Look!
          </p>
          <Link to="/outfits/create" className="of-empty__link">
            Zum Outfit-Creator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{CSS}</style>
      <h1 className="of-title">Meine Outfits</h1>

      {error && (
        <div className="of-error-banner">{error}</div>
      )}

      <div className="of-grid">
        {outfits.map((outfit) => (
          <article
            key={outfit.id}
            className="of-card"
            tabIndex={0}
            role="button"
            onClick={() => openDetail(outfit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetail(outfit);
              }
            }}
          >
            <div className="of-card__thumbs">
              {outfit.items.length === 0 ? (
                <span className="of-card__no-items">Keine Teile</span>
              ) : (
                outfit.items.slice(0, 4).map((item) => (
                  <img
                    key={item.id}
                    src={item.image_url}
                    alt={item.name}
                    className="of-card__thumb"
                  />
                ))
              )}
              {outfit.items.length > 4 && (
                <span className="of-card__more">
                  +{outfit.items.length - 4}
                </span>
              )}
            </div>
            <div className="of-card__body">
              <h3 className="of-card__name">{outfit.name}</h3>
              <p className="of-card__date">{formatDate(outfit.created_at)}</p>
            </div>
            <button
              type="button"
              className="of-card__delete"
              onClick={(e) => {
                e.stopPropagation();
                setDetailOutfit(null);
                setConfirmDelete(outfit.id);
              }}
              title="Outfit löschen"
            >
              &#10005;
            </button>
          </article>
        ))}
      </div>

      {detailOutfit && (
        <div
          className="of-modal-overlay"
          onClick={closeDetail}
          role="presentation"
        >
          <div
            className="of-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="of-modal__header">
              <h2 className="of-modal__title">{detailOutfit.name}</h2>
              <button
                type="button"
                className="of-modal__close"
                onClick={closeDetail}
                title="Schließen"
              >
                &#10005;
              </button>
            </div>
            <p className="of-modal__date">
              Erstellt am {formatDate(detailOutfit.created_at)}
            </p>
            <div className="of-modal__items">
              {detailOutfit.items.map((item) => (
                <div key={item.id} className="of-modal__item">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="of-modal__image"
                  />
                  <div className="of-modal__item-info">
                    <span className="of-modal__item-name">{item.name}</span>
                    <span className="of-modal__item-cat">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div
          className="of-modal-overlay"
          onClick={() => setConfirmDelete(null)}
          role="presentation"
        >
          <div
            className="of-modal of-modal--confirm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <h3 className="of-modal__title">
              Outfit löschen?
            </h3>
            <p className="of-modal__confirm-text">
              Möchtest du dieses Outfit wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </p>
            <div className="of-modal__actions">
              <button
                type="button"
                className="of-modal__btn of-modal__btn--cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="of-modal__btn of-modal__btn--danger"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
              >
                {deleting === confirmDelete ? 'Löscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

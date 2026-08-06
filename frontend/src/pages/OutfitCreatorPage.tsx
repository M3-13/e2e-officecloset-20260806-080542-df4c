import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWardrobe, createOutfit } from '../api/client';
import type { ClothingItemResponse } from '../api/client';

type CategoryKey = string;

const CATEGORY_LABELS: Record<string, string> = {
  top: 'Oberteile',
  bottom: 'Unterteile',
  shoes: 'Schuhe',
  accessory: 'Accessoires',
};

function groupByCategory(items: ClothingItemResponse[]): Map<CategoryKey, ClothingItemResponse[]> {
  const map = new Map<CategoryKey, ClothingItemResponse[]>();
  for (const item of items) {
    const key = item.category.toLowerCase();
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
  }
  return map;
}

const CSS = `
@keyframes oc-spin {
  to { transform: rotate(360deg); }
}

@keyframes oc-check-pop {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.oc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: var(--space-4);
}

.oc-loading__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: oc-spin 0.8s linear infinite;
}

.oc-loading__text {
  color: var(--color-fg_muted);
  font-size: var(--size-lg);
}

.oc-error {
  text-align: center;
  padding: var(--space-9) var(--space-5);
  animation: slideUp 0.4s ease;
}

.oc-error__title {
  font-family: var(--font-family-heading);
  font-size: var(--size-2xl);
  color: var(--color-error);
  margin-bottom: var(--space-3);
}

.oc-error__text {
  color: var(--color-fg_muted);
  font-size: var(--size-lg);
}

.oc-title {
  font-family: var(--font-family-heading);
  font-size: var(--size-3xl);
  color: var(--color-gold);
  margin-bottom: var(--space-6);
  animation: slideUp 0.35s ease;
}

.oc-name-bar {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
  animation: slideUp 0.4s ease;
}

.oc-name-input {
  flex: 1;
  min-width: 240px;
  background: var(--color-bg_input);
  color: var(--color-fg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-family: var(--font-family);
  font-size: var(--size-base);
  min-height: 48px;
  transition: border 0.2s, box-shadow 0.2s;
  outline: none;
}

.oc-name-input::placeholder {
  color: var(--color-fg_muted);
}

.oc-name-input:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
}

.oc-save-btn {
  background: var(--color-accent);
  color: var(--color-fg);
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 28px;
  font-family: var(--font-family);
  font-size: var(--size-base);
  font-weight: 600;
  letter-spacing: 0.03em;
  min-height: 48px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.oc-save-btn:hover:not(:disabled) {
  background: var(--color-accent_hover);
  box-shadow: 0 4px 20px rgba(178, 34, 52, 0.45);
}

.oc-save-btn:active:not(:disabled) {
  background: var(--color-accent_active);
  transform: scale(0.97);
}

.oc-save-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.oc-save-error {
  color: var(--color-error);
  font-size: var(--size-sm);
  width: 100%;
  margin-top: var(--space-1);
}

.oc-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  align-items: start;
}

.oc-pool {
  animation: slideUp 0.45s ease;
}

.oc-pool__heading {
  font-family: var(--font-family-heading);
  font-size: var(--size-xl);
  color: var(--color-fg);
  margin-bottom: var(--space-4);
}

.oc-validation {
  background: rgba(201, 168, 76, 0.08);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  color: var(--color-gold_light);
  font-size: var(--size-sm);
  margin-bottom: var(--space-4);
  animation: fadeIn 0.3s ease;
}

.oc-category {
  margin-bottom: var(--space-6);
}

.oc-category__name {
  font-family: var(--font-family-heading);
  font-size: var(--size-lg);
  color: var(--color-gold);
  margin-bottom: var(--space-3);
}

.oc-category__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-2);
}

.oc-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg_card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 0;
}

.oc-item:hover {
  border-color: var(--color-gold);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(201, 168, 76, 0.3);
}

.oc-item--selected {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 2px var(--color-gold), 0 8px 32px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

.oc-item__img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #0D0808;
}

.oc-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.oc-item:hover .oc-item__img {
  transform: scale(1.05);
}

.oc-item__check {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  background: var(--color-gold);
  color: var(--color-bg);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: oc-check-pop 0.25s ease-out;
}

.oc-item__name {
  font-size: var(--size-xs);
  color: var(--color-fg_muted);
  text-align: center;
  padding: var(--space-1) var(--space-1) var(--space-0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.oc-preview {
  position: sticky;
  top: 80px;
  animation: slideUp 0.5s ease;
}

.oc-preview__heading {
  font-family: var(--font-family-heading);
  font-size: var(--size-xl);
  color: var(--color-fg);
  margin-bottom: var(--space-4);
}

.oc-stage {
  background: radial-gradient(
    ellipse at center,
    rgba(201, 168, 76, 0.06) 0%,
    transparent 70%
  );
  border: 1px dashed rgba(201, 168, 76, 0.4);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  min-height: 420px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  transition: all 0.3s ease;
}

.oc-stage--empty {
  position: relative;
  flex-direction: column;
}

.oc-stage__corners {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.oc-stage__corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: var(--color-gold);
  border-style: solid;
  opacity: 0.5;
}

.oc-stage__corner--tl {
  top: 16px;
  left: 16px;
  border-width: 2px 0 0 2px;
}

.oc-stage__corner--tr {
  top: 16px;
  right: 16px;
  border-width: 2px 2px 0 0;
}

.oc-stage__corner--bl {
  bottom: 16px;
  left: 16px;
  border-width: 0 0 2px 2px;
}

.oc-stage__corner--br {
  bottom: 16px;
  right: 16px;
  border-width: 0 2px 2px 0;
}

.oc-stage__placeholder {
  color: var(--color-fg_muted);
  font-size: var(--size-lg);
  text-align: center;
  line-height: 1.6;
}

.oc-stage--filled {
  flex-direction: row;
  border-style: solid;
}

.oc-stage__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  animation: fadeInScale 0.35s ease-out;
}

.oc-stage__image {
  width: 160px;
  height: 213px;
  object-fit: cover;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.oc-stage__item-name {
  font-size: var(--size-xs);
  color: var(--color-fg_muted);
  text-align: center;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .oc-layout {
    grid-template-columns: 1fr;
  }
  .oc-preview {
    position: static;
  }
  .oc-stage {
    min-height: 320px;
    padding: var(--space-6) var(--space-5);
  }
}

@media (max-width: 640px) {
  .oc-title {
    font-size: var(--size-2xl);
  }
  .oc-name-bar {
    flex-direction: column;
  }
  .oc-name-input {
    width: 100%;
  }
  .oc-save-btn {
    width: 100%;
    justify-content: center;
  }
  .oc-category__grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .oc-stage {
    min-height: 260px;
    padding: var(--space-5) var(--space-3);
  }
  .oc-stage__image {
    width: 120px;
    height: 160px;
  }
  .oc-stage__item-name {
    max-width: 120px;
  }
}
`;

export default function OutfitCreatorPage() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState<ClothingItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [outfitName, setOutfitName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWardrobe()
      .then((data) => {
        if (!cancelled) {
          setWardrobe(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden der Garderobe');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => groupByCategory(wardrobe), [wardrobe]);

  const orderedCategories = useMemo(() => {
    const order = ['top', 'bottom', 'shoes', 'accessory'];
    return order.filter((k) => grouped.has(k));
  }, [grouped]);

  const selectedItems = useMemo(
    () => wardrobe.filter((item) => selectedIds.has(item.id)),
    [wardrobe, selectedIds],
  );

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const hasTop = selectedItems.some(
    (item) => item.category.toLowerCase() === 'top',
  );
  const hasBottom = selectedItems.some(
    (item) => item.category.toLowerCase() === 'bottom',
  );
  const canSave = outfitName.trim().length > 0 && hasTop && hasBottom && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createOutfit(outfitName.trim(), Array.from(selectedIds));
      navigate('/outfits');
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      setSaving(false);
    }
  };

  const renderStage = () => {
    if (selectedItems.length === 0) {
      return (
        <div className="oc-stage oc-stage--empty">
          <div className="oc-stage__corners">
            <span className="oc-stage__corner oc-stage__corner--tl" />
            <span className="oc-stage__corner oc-stage__corner--tr" />
            <span className="oc-stage__corner oc-stage__corner--bl" />
            <span className="oc-stage__corner oc-stage__corner--br" />
          </div>
          <p className="oc-stage__placeholder">
            Klicke Kleidungsstücke an,<br />um dein Outfit zusammenzustellen
          </p>
        </div>
      );
    }

    return (
      <div className="oc-stage oc-stage--filled">
        {selectedItems.map((item) => (
          <div key={item.id} className="oc-stage__item">
            <img
              src={item.image_url}
              alt={item.name}
              className="oc-stage__image"
            />
            <span className="oc-stage__item-name">{item.name}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <style>{CSS}</style>
        <div className="oc-loading">
          <div className="oc-loading__spinner" />
          <p className="oc-loading__text">Garderobe wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <style>{CSS}</style>
        <div className="oc-error">
          <h2 className="oc-error__title">Fehler</h2>
          <p className="oc-error__text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{CSS}</style>
      <h1 className="oc-title">Outfit-Creator</h1>

      <div className="oc-name-bar">
        <input
          type="text"
          className="oc-name-input"
          placeholder="Outfit-Name..."
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
        />
        <button
          type="button"
          className="oc-save-btn"
          disabled={!canSave}
          onClick={handleSave}
        >
          {saving ? 'Speichert...' : 'Outfit speichern'}
        </button>
        {saveError && <p className="oc-save-error">{saveError}</p>}
      </div>

      <div className="oc-layout">
        <div className="oc-pool">
          <h2 className="oc-pool__heading">Meine Garderobe</h2>

          {!hasTop && !hasBottom && selectedItems.length > 0 && (
            <p className="oc-validation">
              Wähle mindestens ein Oberteil und eine Hose aus.
            </p>
          )}
          {!hasTop && hasBottom && selectedItems.length > 0 && (
            <p className="oc-validation">
              Wähle mindestens ein Oberteil aus.
            </p>
          )}
          {hasTop && !hasBottom && selectedItems.length > 0 && (
            <p className="oc-validation">
              Wähle mindestens eine Hose aus.
            </p>
          )}

          {orderedCategories.map((category) => (
            <div key={category} className="oc-category">
              <h3 className="oc-category__name">
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="oc-category__grid">
                {grouped.get(category)!.map((item) => {
                  const selected = selectedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`oc-item${selected ? ' oc-item--selected' : ''}`}
                      onClick={() => toggleItem(item.id)}
                      title={item.name}
                    >
                      <div className="oc-item__img-wrap">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="oc-item__img"
                        />
                        {selected && (
                          <span className="oc-item__check">&#10003;</span>
                        )}
                      </div>
                      <span className="oc-item__name">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="oc-preview">
          <h2 className="oc-preview__heading">Live-Vorschau</h2>
          {renderStage()}
        </div>
      </div>
    </div>
  );
}

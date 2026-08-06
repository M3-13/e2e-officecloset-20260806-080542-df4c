import { useState, useEffect, useRef } from 'react';
import { getWardrobe, createWardrobeItem, deleteWardrobeItem } from '../api/client';
import type { ClothingItemResponse } from '../api/client';

const CATEGORIES = [
  { value: '', label: 'Alle' },
  { value: 'Oberteil', label: 'Oberteil' },
  { value: 'Hose', label: 'Hose' },
  { value: 'Schuhe', label: 'Schuhe' },
  { value: 'Accessoire', label: 'Accessoire' },
];

const FORM_CATEGORIES = ['Oberteil', 'Hose', 'Schuhe', 'Accessoire'];

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItemResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Oberteil');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async (category: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWardrobe(category || undefined);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Garderobe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (value: string) => {
    setSelectedCategory(value === '' ? null : value);
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('Oberteil');
    setFormDescription('');
    setFormImage(null);
    setImagePreview(null);
    setFormError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Bitte geben Sie einen Namen ein.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append('name', formName.trim());
      fd.append('category', formCategory);
      if (formDescription.trim()) {
        fd.append('description', formDescription.trim());
      }
      if (formImage) {
        fd.append('image', formImage);
      }
      await createWardrobeItem(fd);
      setModalOpen(false);
      resetForm();
      await fetchItems(selectedCategory);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Kleidungsstücks.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await deleteWardrobeItem(deleteId);
      setDeleteId(null);
      await fetchItems(selectedCategory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Kleidungsstücks.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const isFiltered = selectedCategory !== null;
  const isEmpty = !loading && items.length === 0 && !error;

  return (
    <div className="page-container">
      <div className="wardrobe-header">
        <h1 className="wardrobe-header__title">Garderobe</h1>
        <button type="button" className="btn-primary btn-gold" onClick={openModal}>
          + Neues Kleidungsstück
        </button>
      </div>

      <div className="wardrobe-filter">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            className={`wardrobe-filter__btn${(cat.value === '' ? selectedCategory === null : selectedCategory === cat.value) ? ' wardrobe-filter__btn--active' : ''}`}
            onClick={() => handleCategoryClick(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && !loading && (
        <div className="wardrobe-error">{error}</div>
      )}

      {loading && (
        <div className="wardrobe-loading">
          <div className="wardrobe-loading__spinner" />
          <p className="wardrobe-loading__text">Garderobe wird geladen...</p>
        </div>
      )}

      {isEmpty && !isFiltered && (
        <div className="wardrobe-empty">
          <div className="wardrobe-empty__icon">&#9733;</div>
          <h2 className="wardrobe-empty__title">Deine Garderobe ist leer</h2>
          <p className="wardrobe-empty__text">
            Füge dein erstes Meisterwerk hinzu und beginne deine glamouröse Sammlung.
          </p>
        </div>
      )}

      {isEmpty && isFiltered && (
        <div className="wardrobe-empty">
          <div className="wardrobe-empty__icon">&#128269;</div>
          <h2 className="wardrobe-empty__title">Keine Kleidungsstücke gefunden</h2>
          <p className="wardrobe-empty__text">
            In dieser Kategorie gibt es noch keine Kleidungsstücke.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="wardrobe-grid">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="wardrobe-card"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="wardrobe-card__image-wrapper">
                <img
                  className="wardrobe-card__image"
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                />
              </div>
              <div className="wardrobe-card__info">
                <h3 className="wardrobe-card__name">{item.name}</h3>
                <span className="wardrobe-card__category">{item.category}</span>
              </div>
              <button
                type="button"
                className="wardrobe-card__delete"
                title="Löschen"
                onClick={() => setDeleteId(item.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-dialog__title">Neues Kleidungsstück</h2>
            <button
              type="button"
              className="modal-dialog__close"
              onClick={closeModal}
              disabled={submitting}
            >
              &times;
            </button>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="wardrobe-name">Name</label>
                <input
                  id="wardrobe-name"
                  className="form-input"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="z.B. Rotes Abendkleid"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="wardrobe-category">Kategorie</label>
                <select
                  id="wardrobe-category"
                  className="form-input form-input--select"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                  disabled={submitting}
                >
                  {FORM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="wardrobe-description">Beschreibung (optional)</label>
                <textarea
                  id="wardrobe-description"
                  className="form-input form-input--textarea"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Beschreiben Sie Ihr Kleidungsstück..."
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="wardrobe-image">Bild</label>
                <input
                  id="wardrobe-image"
                  ref={fileInputRef}
                  className="form-input form-input--file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img
                      className="image-preview__img"
                      src={imagePreview}
                      alt="Vorschau"
                    />
                  </div>
                )}
              </div>

              {formError && <div className="form-error">{formError}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-gold"
                  disabled={submitting}
                >
                  {submitting ? 'Wird erstellt...' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="confirm-overlay" onClick={() => { if (!deleting) setDeleteId(null); }}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-dialog__title">Kleidungsstück löschen</h3>
            <p className="confirm-dialog__text">
              Bist du sicher, dass du dieses Kleidungsstück entfernen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="confirm-dialog__actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn-ghost btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import type { Gift } from '../../lib/types/gifts';
import { GIFT_CATEGORIES, encodeAccessToken } from '../../lib/wishlist-access';

interface FormData {
  name: string;
  price: string;
  url: string;
  store: string;
  rating: string;
  dateAdded: string;
  category: string;
  notes: string;
  purchased: boolean;
}

const EMPTY_FORM: FormData = {
  name: '',
  price: '',
  url: '',
  store: '',
  rating: '',
  dateAdded: new Date().toISOString().slice(0, 10),
  category: GIFT_CATEGORIES[0],
  notes: '',
  purchased: false,
};

export default function GiftAdminForm() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch('/private/api/gifts-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { gifts: Gift[] };
      setGifts(json.gifts);
    } catch {
      setMessage({ type: 'err', text: 'Failed to load gifts' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (gift: Gift) => {
    setEditingId(gift.id);
    setForm({
      name: gift.name,
      price: gift.price?.toString() ?? '',
      url: gift.url ?? '',
      store: gift.store ?? '',
      rating: gift.rating?.toString() ?? '',
      dateAdded: gift.dateAdded,
      category: gift.category,
      notes: gift.notes ?? '',
      purchased: gift.purchased,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this gift?')) return;
    try {
      const res = await fetch('/private/api/gifts-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setMessage({ type: 'ok', text: 'Gift deleted' });
      await fetchGifts();
    } catch {
      setMessage({ type: 'err', text: 'Failed to delete gift' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const giftPayload = {
      name: form.name,
      price: form.price ? Number(form.price) : null,
      url: form.url || null,
      store: form.store || null,
      rating: form.rating ? Number(form.rating) : null,
      dateAdded: form.dateAdded,
      category: form.category,
      notes: form.notes || null,
      purchased: form.purchased,
    };

    try {
      const body = editingId
        ? { action: 'update' as const, id: editingId, gift: giftPayload }
        : { action: 'create' as const, gift: giftPayload };

      const res = await fetch('/private/api/gifts-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Save failed');
      }

      setMessage({ type: 'ok', text: editingId ? 'Gift updated' : 'Gift created' });
      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchGifts();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage(null);
  };

  const copyShareLink = (categories: string[]) => {
    const code = encodeAccessToken(categories);
    const link = `${window.location.origin}/wishlist?code=${code}`;
    navigator.clipboard.writeText(link);
    const key = categories.join(',');
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const inputClass = 'w-full bg-page border border-stroke rounded-md px-3 py-2 text-sm text-body focus:outline-none focus:border-accent';
  const labelClass = 'block text-xs font-medium text-dim uppercase tracking-wide mb-1';

  // Get unique categories from existing gifts
  const existingCategories = [...new Set(gifts.map((g) => g.category))].sort();
  const allCategories = [...new Set([...GIFT_CATEGORIES, ...existingCategories])].sort();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-heading">
        {editingId ? 'Edit Gift' : 'Add Gift'}
      </h2>

      {message && (
        <div className={`rounded-md px-4 py-2 text-sm ${message.type === 'ok' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-tile border border-stroke rounded-lg p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Gift Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Price</label>
            <input className={inputClass} type="number" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="Leave blank if unknown" />
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <input className={inputClass} value={form.url} onChange={(e) => setField('url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Store</label>
            <input className={inputClass} value={form.store} onChange={(e) => setField('store', e.target.value)} placeholder="e.g. Amazon" />
          </div>
          <div>
            <label className={labelClass}>Rating</label>
            <select className={inputClass} value={form.rating} onChange={(e) => setField('rating', e.target.value)}>
              <option value="">No rating</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date Added</label>
            <input className={inputClass} type="date" value={form.dateAdded} onChange={(e) => setField('dateAdded', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <input className={inputClass} value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="e.g. size L, blue" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="purchased"
            checked={form.purchased}
            onChange={(e) => setField('purchased', e.target.checked)}
            className="accent-accent"
          />
          <label htmlFor="purchased" className="text-sm text-body">Purchased</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium bg-accent text-white rounded-md px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Gift' : 'Add Gift'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="text-sm font-medium text-subtle border border-stroke rounded-md px-4 py-2 hover:text-body">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Share Links */}
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6 space-y-3">
        <h3 className="text-sm font-semibold text-heading">Share Links</h3>
        <p className="text-xs text-dim">Copy a link to share your wishlist with others. Each link grants access to specific categories.</p>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => copyShareLink([cat])}
              className="text-xs font-medium border border-stroke rounded-md px-3 py-1.5 hover:border-accent transition-colors"
            >
              {copiedLink === cat ? 'Copied!' : cat}
            </button>
          ))}
          {allCategories.length > 1 && (
            <button
              onClick={() => copyShareLink([...allCategories])}
              className="text-xs font-medium border border-stroke rounded-md px-3 py-1.5 hover:border-accent transition-colors"
            >
              {copiedLink === allCategories.join(',') ? 'Copied!' : 'All categories'}
            </button>
          )}
        </div>
      </div>

      {/* Existing Gifts */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-heading">Existing Gifts</h3>
        {loading ? (
          <div className="text-dim text-sm">Loading...</div>
        ) : gifts.length === 0 ? (
          <div className="bg-tile border border-stroke rounded-lg p-6 text-center text-dim">No gifts yet</div>
        ) : (
          gifts.map((gift) => (
            <div key={gift.id} className="bg-tile border border-stroke rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-heading text-sm">{gift.name}</span>
                  {gift.price != null && <span className="text-dim text-xs">${gift.price.toFixed(2)}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">{gift.category}</span>
                  {gift.purchased && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">purchased</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(gift)} className="text-xs text-accent hover:underline">Edit</button>
                  <button onClick={() => handleDelete(gift.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
              <div className="text-xs text-dim">
                {gift.dateAdded}
                {gift.store ? ` · ${gift.store}` : ''}
                {gift.rating ? ` · ${'★'.repeat(gift.rating)}${'☆'.repeat(5 - gift.rating)}` : ''}
                {gift.notes ? ` · ${gift.notes}` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

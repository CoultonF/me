import { useState, useEffect, useCallback } from 'react';
import type { RaceWithResult } from '../../lib/types/races';

type Status = 'completed' | 'upcoming' | 'target';

interface FormData {
  name: string;
  date: string;
  location: string;
  distance: string;
  customDistance: string;
  status: Status;
  resultsUrl: string;
  // Result fields
  bibNumber: string;
  chipTime: string;
  gunTime: string;
  pacePerKm: string;
  city: string;
  division: string;
  overallPlace: string;
  overallTotal: string;
  genderPlace: string;
  genderTotal: string;
  divisionPlace: string;
  divisionTotal: string;
  resultResultsUrl: string;
}

const PRESET_DISTANCES = ['5K', '10K', 'Half Marathon', 'Marathon', 'Custom'];

const EMPTY_FORM: FormData = {
  name: '', date: '', location: '', distance: '10K', customDistance: '', status: 'completed', resultsUrl: '',
  bibNumber: '', chipTime: '', gunTime: '', pacePerKm: '', city: '', division: '',
  overallPlace: '', overallTotal: '', genderPlace: '', genderTotal: '',
  divisionPlace: '', divisionTotal: '', resultResultsUrl: '',
};

const DISTANCE_KM: Record<string, number> = {
  '5K': 5, '10K': 10, 'Half Marathon': 21.0975, 'Marathon': 42.195,
};

function computePace(chipTime: string, distance: string): string {
  const parts = chipTime.split(':').map(Number);
  let totalSeconds = 0;
  if (parts.length === 3) totalSeconds = parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  else if (parts.length === 2) totalSeconds = parts[0]! * 60 + parts[1]!;
  if (totalSeconds <= 0) return '';
  const km = DISTANCE_KM[distance];
  if (!km) return '';
  const paceSeconds = totalSeconds / km;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function RaceAdminForm() {
  const [races, setRaces] = useState<RaceWithResult[]>([]);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchRaces = useCallback(async () => {
    try {
      const res = await fetch('/api/health/races');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { completed?: RaceWithResult[]; upcoming?: RaceWithResult[] };
      const all = [...(json.completed ?? []), ...(json.upcoming ?? [])];
      all.sort((a: RaceWithResult, b: RaceWithResult) => b.date.localeCompare(a.date));
      setRaces(all);
    } catch {
      setMessage({ type: 'err', text: 'Failed to load races' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRaces(); }, [fetchRaces]);

  const setField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChipTimeBlur = () => {
    const dist = form.distance === 'Custom' ? form.customDistance : form.distance;
    const pace = computePace(form.chipTime, dist);
    if (pace) setField('pacePerKm', pace);
  };

  const handleEdit = (race: RaceWithResult) => {
    setEditingId(race.id);
    const isCustom = !PRESET_DISTANCES.slice(0, -1).includes(race.distance);
    setForm({
      name: race.name,
      date: race.date,
      location: race.location ?? '',
      distance: isCustom ? 'Custom' : race.distance,
      customDistance: isCustom ? race.distance : '',
      status: race.status,
      resultsUrl: race.resultsUrl ?? '',
      bibNumber: race.result?.bibNumber ?? '',
      chipTime: race.result?.chipTime ?? '',
      gunTime: race.result?.gunTime ?? '',
      pacePerKm: race.result?.pacePerKm ?? '',
      city: race.result?.city ?? '',
      division: race.result?.division ?? '',
      overallPlace: race.result?.overallPlace?.toString() ?? '',
      overallTotal: race.result?.overallTotal?.toString() ?? '',
      genderPlace: race.result?.genderPlace?.toString() ?? '',
      genderTotal: race.result?.genderTotal?.toString() ?? '',
      divisionPlace: race.result?.divisionPlace?.toString() ?? '',
      divisionTotal: race.result?.divisionTotal?.toString() ?? '',
      resultResultsUrl: race.result?.resultsUrl ?? '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this race?')) return;
    try {
      const res = await fetch('/private/api/races-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      setMessage({ type: 'ok', text: 'Race deleted' });
      await fetchRaces();
    } catch {
      setMessage({ type: 'err', text: 'Failed to delete race' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const distance = form.distance === 'Custom' ? form.customDistance : form.distance;
    const racePayload = {
      name: form.name,
      date: form.date,
      location: form.location || null,
      distance,
      status: form.status,
      resultsUrl: form.resultsUrl || null,
    };

    const resultPayload = form.status === 'completed' ? {
      bibNumber: form.bibNumber || null,
      chipTime: form.chipTime || null,
      gunTime: form.gunTime || null,
      pacePerKm: form.pacePerKm || null,
      city: form.city || null,
      division: form.division || null,
      overallPlace: form.overallPlace ? Number(form.overallPlace) : null,
      overallTotal: form.overallTotal ? Number(form.overallTotal) : null,
      genderPlace: form.genderPlace ? Number(form.genderPlace) : null,
      genderTotal: form.genderTotal ? Number(form.genderTotal) : null,
      divisionPlace: form.divisionPlace ? Number(form.divisionPlace) : null,
      divisionTotal: form.divisionTotal ? Number(form.divisionTotal) : null,
      resultsUrl: form.resultResultsUrl || null,
    } : undefined;

    try {
      const body = editingId
        ? { action: 'update' as const, id: editingId, race: racePayload, result: resultPayload }
        : { action: 'create' as const, race: racePayload, result: resultPayload };

      const res = await fetch('/private/api/races-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Save failed');
      }

      setMessage({ type: 'ok', text: editingId ? 'Race updated' : 'Race created' });
      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchRaces();
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

  const inputClass = 'w-full bg-page border border-stroke rounded-md px-3 py-2 text-sm text-body focus:outline-none focus:border-accent';
  const labelClass = 'block text-xs font-medium text-dim uppercase tracking-wide mb-1';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-heading">
        {editingId ? 'Edit Race' : 'Add Race'}
      </h2>

      {message && (
        <div className={`rounded-md px-4 py-2 text-sm ${message.type === 'ok' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-tile border border-stroke rounded-lg p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Race Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input className={inputClass} type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input className={inputClass} value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Calgary, AB" />
          </div>
          <div>
            <label className={labelClass}>Distance</label>
            <select className={inputClass} value={form.distance} onChange={(e) => setField('distance', e.target.value)}>
              {PRESET_DISTANCES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {form.distance === 'Custom' && (
              <input className={`${inputClass} mt-2`} value={form.customDistance} onChange={(e) => setField('customDistance', e.target.value)} placeholder="e.g. 15K" required />
            )}
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => setField('status', e.target.value as Status)}>
              <option value="completed">Completed</option>
              <option value="upcoming">Upcoming</option>
              <option value="target">Target</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Results Page URL</label>
            <input className={inputClass} value={form.resultsUrl} onChange={(e) => setField('resultsUrl', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        {form.status === 'completed' && (
          <>
            <div className="border-t border-stroke pt-4">
              <h3 className="text-sm font-semibold text-heading mb-3">Result</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Bib Number</label>
                  <input className={inputClass} value={form.bibNumber} onChange={(e) => setField('bibNumber', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Chip Time</label>
                  <input className={inputClass} value={form.chipTime} onChange={(e) => setField('chipTime', e.target.value)} onBlur={handleChipTimeBlur} placeholder="H:MM:SS" />
                </div>
                <div>
                  <label className={labelClass}>Gun Time</label>
                  <input className={inputClass} value={form.gunTime} onChange={(e) => setField('gunTime', e.target.value)} placeholder="H:MM:SS" />
                </div>
                <div>
                  <label className={labelClass}>Pace /km</label>
                  <input className={inputClass} value={form.pacePerKm} onChange={(e) => setField('pacePerKm', e.target.value)} placeholder="MM:SS" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input className={inputClass} value={form.city} onChange={(e) => setField('city', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Division</label>
                  <input className={inputClass} value={form.division} onChange={(e) => setField('division', e.target.value)} placeholder="M3034" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Overall Place</label>
                <div className="flex gap-2 items-center">
                  <input className={inputClass} type="number" value={form.overallPlace} onChange={(e) => setField('overallPlace', e.target.value)} />
                  <span className="text-dim text-sm">/</span>
                  <input className={inputClass} type="number" value={form.overallTotal} onChange={(e) => setField('overallTotal', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Gender Place</label>
                <div className="flex gap-2 items-center">
                  <input className={inputClass} type="number" value={form.genderPlace} onChange={(e) => setField('genderPlace', e.target.value)} />
                  <span className="text-dim text-sm">/</span>
                  <input className={inputClass} type="number" value={form.genderTotal} onChange={(e) => setField('genderTotal', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Division Place</label>
                <div className="flex gap-2 items-center">
                  <input className={inputClass} type="number" value={form.divisionPlace} onChange={(e) => setField('divisionPlace', e.target.value)} />
                  <span className="text-dim text-sm">/</span>
                  <input className={inputClass} type="number" value={form.divisionTotal} onChange={(e) => setField('divisionTotal', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Result URL</label>
              <input className={inputClass} value={form.resultResultsUrl} onChange={(e) => setField('resultResultsUrl', e.target.value)} placeholder="https://..." />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium bg-accent text-white rounded-md px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Race' : 'Add Race'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="text-sm font-medium text-subtle border border-stroke rounded-md px-4 py-2 hover:text-body">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-heading">Existing Races</h3>
        {loading ? (
          <div className="text-dim text-sm">Loading...</div>
        ) : races.length === 0 ? (
          <div className="bg-tile border border-stroke rounded-lg p-6 text-center text-dim">No races yet</div>
        ) : (
          races.map((race) => (
            <div key={race.id} className="bg-tile border border-stroke rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-heading text-sm">{race.name}</span>
                  <span className="text-dim text-xs ml-2">{race.distance}</span>
                  <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                    race.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                    race.status === 'target' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>{race.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(race)} className="text-xs text-accent hover:underline">Edit</button>
                  <button onClick={() => handleDelete(race.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>
              <div className="text-xs text-dim">
                {race.date} {race.location ? `· ${race.location}` : ''}
                {race.result?.chipTime ? ` · ${race.result.chipTime}` : ''}
                {race.result?.pacePerKm ? ` · ${race.result.pacePerKm}/km` : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

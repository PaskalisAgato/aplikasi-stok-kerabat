import React, { useState, useEffect, useCallback } from 'react';


// ─── API Client ───────────────────────────────────────────────────────────────
const API_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const { hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
  return isLocal ? 'http://localhost:5000' : 'https://aplikasi-stok-kerabat.onrender.com';
})();

async function apiFetch(path: string, init?: RequestInit) {
  const token = localStorage.getItem('kerabat_auth_token');
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API Error');
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  points: number;
  level: 'bronze' | 'silver' | 'gold';
  isActive: boolean;
  createdAt: string;
}

interface Discount {
  id: number;
  name: string;
  type: 'percent' | 'nominal' | 'time-based' | 'bundling' | 'member';
  value: string;
  conditions?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  gold: '#f59e0b',
  silver: '#94a3b8',
  bronze: '#c97a3a',
};

const LEVEL_LABELS: Record<string, string> = {
  gold: '🥇 Gold',
  silver: '🥈 Silver',
  bronze: '🥉 Bronze',
};

const TYPE_LABELS: Record<string, string> = {
  percent: '% Persen',
  nominal: 'Rp Nominal',
  'time-based': '⏰ Waktu',
  bundling: '📦 Bundling',
  member: '👤 Member',
};

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

// ─── Member Tab ───────────────────────────────────────────────────────────────
function MemberTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'adjust' | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [adjDelta, setAdjDelta] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/members?search=${encodeURIComponent(search)}`);
      setMembers(res.data || []);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: '', phone: '', email: '' }); setError(''); setModal('create'); };
  const openEdit = (m: Member) => { setSelected(m); setForm({ name: m.name, phone: m.phone, email: m.email || '' }); setError(''); setModal('edit'); };
  const openAdjust = (m: Member) => { setSelected(m); setAdjDelta(''); setAdjReason(''); setError(''); setModal('adjust'); };

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Nama dan No HP wajib diisi'); return; }
    setSaving(true); setError('');
    try {
      if (modal === 'create') {
        await apiFetch('/members', { method: 'POST', body: JSON.stringify(form) });
      } else if (modal === 'edit' && selected) {
        await apiFetch(`/members/${selected.id}`, { method: 'PUT', body: JSON.stringify(form) });
      }
      setModal(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleAdjust = async () => {
    if (!adjDelta || !selected) { setError('Masukkan jumlah poin'); return; }
    setSaving(true); setError('');
    try {
      await apiFetch(`/members/${selected.id}/adjust-points`, {
        method: 'POST',
        body: JSON.stringify({ delta: parseInt(adjDelta), reason: adjReason }),
      });
      setModal(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(`Hapus member "${m.name}"?`)) return;
    try {
      await apiFetch(`/members/${m.id}`, { method: 'DELETE' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>search</span>
          <input
            placeholder="Cari nama / No HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-main)', fontSize: '0.875rem' }}
          />
        </div>
        <button onClick={openCreate} style={btnStyle('primary')}>
          <span className="material-symbols-outlined">person_add</span> Tambah Member
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data...</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: 8 }}>group_off</span>
          Belum ada member terdaftar
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                {['Nama', 'No HP', 'Email', 'Level', 'Poin', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{m.name}</div>
                    {!m.isActive && <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>Tidak Aktif</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{m.phone}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{m.email || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: `${LEVEL_COLORS[m.level]}22`, color: LEVEL_COLORS[m.level] }}>
                      {LEVEL_LABELS[m.level]}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>{m.points.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(m.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openAdjust(m)} style={iconBtn('#a78bfa22', '#a78bfa')} title="Adjust Poin">
                        <span className="material-symbols-outlined">stars</span>
                      </button>
                      <button onClick={() => openEdit(m)} style={iconBtn('#22c55e22', '#22c55e')} title="Edit">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => handleDelete(m)} style={iconBtn('#ef444422', '#ef4444')} title="Hapus">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Tambah Member Baru' : 'Edit Member'} onClose={() => setModal(null)}>
          <Field label="Nama Lengkap *">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama member" style={inputStyle} />
          </Field>
          <Field label="No HP *">
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="081234567890" style={inputStyle} />
          </Field>
          <Field label="Email (Opsional)">
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@contoh.com" type="email" style={inputStyle} />
          </Field>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={btnStyle('ghost')}>Batal</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnStyle('primary'), flex: 1 }}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </Modal>
      )}

      {/* Adjust Points Modal */}
      {modal === 'adjust' && selected && (
        <Modal title={`Adjust Poin — ${selected.name}`} onClose={() => setModal(null)}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 10, marginBottom: 12, textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Poin Saat Ini</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{selected.points.toLocaleString('id-ID')}</div>
          </div>
          <Field label="Delta Poin (+ untuk tambah, - untuk kurang)">
            <input type="number" value={adjDelta} onChange={e => setAdjDelta(e.target.value)} placeholder="contoh: 100 atau -50" style={inputStyle} />
          </Field>
          <Field label="Alasan">
            <input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Alasan penyesuaian poin" style={inputStyle} />
          </Field>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={btnStyle('ghost')}>Batal</button>
            <button onClick={handleAdjust} disabled={saving} style={{ ...btnStyle('primary'), flex: 1 }}>
              {saving ? 'Menyimpan...' : 'Simpan Penyesuaian'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Discount Tab ─────────────────────────────────────────────────────────────
function DiscountTab() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Discount | null>(null);
  const [form, setForm] = useState<any>({
    name: '', type: 'percent', value: '', isActive: true,
    startDate: '', endDate: '',
    // condition fields
    days: [] as number[], startHour: '', endHour: '',
    productIds: '', minLevel: 'bronze', discountType: 'percent'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const [dRes, pRes] = await Promise.all([
        apiFetch('/discounts'),
        apiFetch('/products')
      ]);
      setDiscounts(dRes.data || []);
      setProducts(pRes || []);
    }
    catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: '', type: 'percent', value: '', isActive: true, startDate: '', endDate: '', days: [], startHour: '', endHour: '', productIds: '', minLevel: 'bronze', discountType: 'percent' });
    setError(''); setModal('create');
  };

  const openEdit = (d: Discount) => {
    let cond: any = {};
    try { cond = d.conditions ? JSON.parse(d.conditions) : {}; } catch {}
    setSelected(d);
    setForm({
      name: d.name, type: d.type, value: d.value, isActive: d.isActive,
      startDate: d.startDate?.slice(0, 10) || '', endDate: d.endDate?.slice(0, 10) || '',
      days: cond.days || [], startHour: cond.startHour?.toString() || '', endHour: cond.endHour?.toString() || '',
      productIds: (cond.productIds || []).join(','), minLevel: cond.minLevel || 'bronze', discountType: cond.discountType || 'percent'
    });
    setError(''); setModal('edit');
  };

  const buildConditions = () => {
    const c: any = {};
    if (form.type === 'time-based') {
      if (form.days.length > 0) c.days = form.days;
      if (form.startHour !== '') c.startHour = parseInt(form.startHour);
      if (form.endHour !== '') c.endHour = parseInt(form.endHour);
      c.discountType = form.discountType;
    }
    if (form.type === 'bundling') {
      c.productIds = form.productIds.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
      c.discountType = form.discountType;
    }
    if (form.type === 'member') {
      c.minLevel = form.minLevel;
    }
    return Object.keys(c).length > 0 ? c : null;
  };

  const handleSave = async () => {
    if (!form.name || !form.value) { setError('Nama dan Nilai diskon wajib diisi'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name, type: form.type, value: parseFloat(form.value),
        isActive: form.isActive,
        startDate: form.startDate || null, endDate: form.endDate || null,
        conditions: buildConditions(),
      };
      if (modal === 'create') {
        await apiFetch('/discounts', { method: 'POST', body: JSON.stringify(payload) });
      } else if (modal === 'edit' && selected) {
        await apiFetch(`/discounts/${selected.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      setModal(null); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d: Discount) => {
    if (!confirm(`Hapus diskon "${d.name}"?`)) return;
    try { await apiFetch(`/discounts/${d.id}`, { method: 'DELETE' }); load(); }
    catch (e: any) { alert(e.message); }
  };

  const toggleDay = (day: number) => setForm((f: any) => ({
    ...f, days: f.days.includes(day) ? f.days.filter((d: number) => d !== day) : [...f.days, day]
  }));

  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button onClick={openCreate} style={btnStyle('primary')}>
          <span className="material-symbols-outlined">add_circle</span> Buat Diskon Baru
        </button>
      </div>

      {/* Discount list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat data...</div>
      ) : discounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: 8 }}>local_offer_off</span>
          Belum ada diskon
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {discounts.map(d => {
            let cond: any = {};
            try { cond = d.conditions ? JSON.parse(d.conditions) : {}; } catch {}
            return (
              <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: '#a78bfa22', color: '#a78bfa' }}>
                      {TYPE_LABELS[d.type] || d.type}
                    </span>
                  </div>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: d.type === 'percent' ? 'var(--primary)' : 'var(--success)' }}>
                    {d.type === 'percent' ? `${parseFloat(d.value)}%` : formatRp(parseFloat(d.value))}
                  </span>
                </div>
                {/* Conditions summary */}
                {cond.days && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hari: {cond.days.map((n: number) => DAYS[n]).join(', ')}</div>}
                {cond.startHour !== undefined && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Jam: {cond.startHour}:00–{cond.endHour}:00</div>}
                {cond.productIds && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bundling IDs: {cond.productIds.join(', ')}</div>}
                {cond.minLevel && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Min Level: {LEVEL_LABELS[cond.minLevel]}</div>}
                {(d.startDate || d.endDate) && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {d.startDate ? new Date(d.startDate).toLocaleDateString('id-ID') : '∞'} — {d.endDate ? new Date(d.endDate).toLocaleDateString('id-ID') : '∞'}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, background: d.isActive ? '#22c55e22' : '#ef444422', color: d.isActive ? 'var(--success)' : 'var(--danger)' }}>
                    {d.isActive ? '● Aktif' : '○ Nonaktif'}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => openEdit(d)} style={iconBtn('#22c55e22', '#22c55e')} title="Edit">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button onClick={() => handleDelete(d)} style={iconBtn('#ef444422', '#ef4444')} title="Hapus">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discount Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Buat Diskon Baru' : 'Edit Diskon'} onClose={() => setModal(null)} wide>
          <Field label="Nama Diskon *">
            <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="contoh: Happy Hour Sore" style={inputStyle} />
          </Field>
          <Field label="Jenis Diskon *">
            <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} style={inputStyle}>
              <option value="percent">Persen (%)</option>
              <option value="nominal">Nominal (Rp)</option>
              <option value="time-based">Berdasarkan Waktu</option>
              <option value="bundling">Bundling Produk</option>
              <option value="member">Diskon Member</option>
            </select>
          </Field>
          <Field label={`Nilai Diskon * ${form.type === 'percent' ? '(%)' : '(Rp)'}`}>
            <input type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percent' ? 'contoh: 10' : 'contoh: 5000'} style={inputStyle} />
          </Field>

          {/* Kondisi khusus berdasarkan tipe */}
          {form.type === 'time-based' && (
            <>
              <Field label="Hari Berlaku">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAYS.map((day, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(i)}
                      style={{ padding: '0.3rem 0.6rem', borderRadius: 8, border: `1px solid ${form.days.includes(i) ? 'var(--primary)' : 'var(--border)'}`, background: form.days.includes(i) ? '#a78bfa22' : 'transparent', color: form.days.includes(i) ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                      {day}
                    </button>
                  ))}
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Jam Mulai (0–23)">
                  <input type="number" min={0} max={23} value={form.startHour} onChange={e => setForm((f: any) => ({ ...f, startHour: e.target.value }))} placeholder="8" style={inputStyle} />
                </Field>
                <Field label="Jam Selesai (0–23)">
                  <input type="number" min={0} max={23} value={form.endHour} onChange={e => setForm((f: any) => ({ ...f, endHour: e.target.value }))} placeholder="10" style={inputStyle} />
                </Field>
              </div>
            </>
          )}
          {form.type === 'bundling' && (
            <>
              <Field label="ID Produk Bundling (pisahkan dengan koma)">
                <input value={form.productIds} onChange={e => setForm((f: any) => ({ ...f, productIds: e.target.value }))} placeholder="contoh: 1,5,12" style={inputStyle} />
              </Field>
              <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: 'var(--bg-app)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Katalog Produk (ID)</span>
                  <input 
                    placeholder="Cari menu..." 
                    style={{ ...inputStyle, width: '120px', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    value={prodSearch}
                    onChange={e => setProdSearch(e.target.value)}
                  />
                </div>
                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {products.filter(p => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase())).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.7rem' }}>
                      <span style={{ fontWeight: 900, color: 'var(--primary)', minWidth: 20 }}>#{p.id}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {form.type === 'member' && (
            <Field label="Level Minimum Member">
              <select value={form.minLevel} onChange={e => setForm((f: any) => ({ ...f, minLevel: e.target.value }))} style={inputStyle}>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Tanggal Mulai (Opsional)">
              <input type="date" value={form.startDate} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Tanggal Selesai (Opsional)">
              <input type="date" value={form.endDate} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="Status">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: '0.875rem' }}>Diskon Aktif</span>
            </label>
          </Field>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => setModal(null)} style={btnStyle('ghost')}>Batal</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnStyle('primary'), flex: 1 }}>
              {saving ? 'Menyimpan...' : 'Simpan Diskon'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: wide ? 560 : 420, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text-main)', fontSize: '0.875rem', width: '100%',
};

function btnStyle(variant: 'primary' | 'ghost'): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0.55rem 1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
    border: variant === 'ghost' ? '1px solid var(--border)' : 'none',
    background: variant === 'primary' ? 'var(--primary)' : 'transparent',
    color: variant === 'primary' ? '#0a0a0f' : 'var(--text-muted)',
    cursor: 'pointer', transition: 'all .15s',
    whiteSpace: 'nowrap',
  };
}

function iconBtn(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, border: 'none', borderRadius: 8, padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<'members' | 'discounts'>('members');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>loyalty</span>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>Member & Diskon</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelola loyalty program dan sistem diskon</p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0.75rem 1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        {([['members', 'group', 'Manajemen Member'], ['discounts', 'local_offer', 'Pengaturan Diskon']] as const).map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              background: tab === key ? 'var(--primary)' : 'transparent',
              color: tab === key ? '#0a0a0f' : 'var(--text-muted)',
              transition: 'all .15s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'members' ? <MemberTab /> : <DiscountTab />}
      </div>
    </div>
  );
}

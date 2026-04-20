import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@shared/Layout';


// ─── API Client ───────────────────────────────────────────────────────────────
const API_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const { hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
  return isLocal ? 'http://localhost:5000' : 'https://api.kerabatkopitiam.my.id';
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

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ─── Member Tab ───────────────────────────────────────────────────────────────
function MemberTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'adjust' | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
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

  const openCreate = () => { setForm({ name: '', phone: '' }); setError(''); setModal('create'); };
  const openEdit = (m: Member) => { setSelected(m); setForm({ name: m.name, phone: m.phone }); setError(''); setModal('edit'); };
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">search</span>
          <input
            placeholder="Cari member (Nama / No HP)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-dim)] rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-glow)] transition-all shadow-sm"
          />
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 h-12">
          <span className="material-symbols-outlined">person_add</span>
          <span className="hidden sm:inline">Tambah Member</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>

      {/* Member Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] animate-pulse">
          <div className="size-12 border-4 border-[var(--border-dim)] border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
          <p className="font-bold uppercase tracking-widest text-[10px]">Memuat data member...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center border-dashed border-2 border-[var(--border-dim)]">
          <span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-4 opacity-30">group_off</span>
          <h3 className="font-display text-xl font-bold mb-1">Belum ada member</h3>
          <p className="text-sm text-[var(--text-muted)]">Daftarkan pelanggan Anda untuk mulai mengelola poin loyalty.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block glass rounded-[2rem] overflow-hidden border border-[var(--border-dim)] shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-[var(--border-dim)]">
                    {['Nama Member', 'Kontak', 'Poin', 'Level', 'Tgl Gabung', 'Aksi'].map(h => (
                      <th key={h} className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-dim)]">
                  {members.map(m => (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: `${LEVEL_COLORS[m.level]}22`, color: LEVEL_COLORS[m.level] }}>
                            {m.name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--text-main)]">{m.name}</p>
                            {!m.isActive && <span className="text-[9px] font-black uppercase text-red-400">Akun Nonaktif</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="text-xs font-black text-primary uppercase tracking-wider">{m.phone}</p>
                      </td>
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[var(--primary)]">{m.points.toLocaleString('id-ID')}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Points</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: `${LEVEL_COLORS[m.level]}22`, color: LEVEL_COLORS[m.level], border: `1px solid ${LEVEL_COLORS[m.level]}44` }}>
                          {LEVEL_LABELS[m.level]}
                        </span>
                      </td>
                      <td className="p-5 text-[var(--text-muted)] text-xs font-medium">
                        {new Date(m.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openAdjust(m)} className="size-9 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm" title="Adjust Poin">
                            <span className="material-symbols-outlined text-lg">hotel_class</span>
                          </button>
                          <button onClick={() => openEdit(m)} className="size-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="Edit Profile">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => handleDelete(m)} className="size-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Hapus Member">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {members.map(m => (
              <div key={m.id} className="card p-5 !rounded-3xl relative overflow-hidden group active:scale-[0.98] transition-all">
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                   <button onClick={() => openAdjust(m)} className="size-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center"><span className="material-symbols-outlined text-sm">hotel_class</span></button>
                   <button onClick={() => openEdit(m)} className="size-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center"><span className="material-symbols-outlined text-sm">edit</span></button>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner" style={{ background: `${LEVEL_COLORS[m.level]}22`, color: LEVEL_COLORS[m.level], border: `1px solid ${LEVEL_COLORS[m.level]}33` }}>
                    {m.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 pr-16">
                    <p className="font-bold text-base truncate text-[var(--text-main)]">{m.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{m.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border-dim)]">
                   <div className="bg-black/20 rounded-2xl p-3 flex flex-col items-center">
                    <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">Total Points</span>
                    <span className="text-lg font-black text-[var(--primary)]">{m.points.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-3 flex flex-col items-center">
                    <span className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest mb-1">Member Level</span>
                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: LEVEL_COLORS[m.level] }}>{LEVEL_LABELS[m.level].split(' ')[1]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Member Modals handled separately for brevity, but styled with premium tokens below */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Daftar Member Baru' : 'Perbarui Profil Member'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Nama Lengkap Pelanggan">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Masukkan nama lengkap..." className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all" />
            </Field>
            <Field label="Nomor Handphone (WhatsApp)">
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08XXXXXXXXXX" className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all" />
            </Field>

            {error && <p className="text-[var(--danger)] text-xs font-bold text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-2 py-3">
                {saving ? 'Menyimpan...' : (modal === 'create' ? 'Daftarkan Member' : 'Simpan Perubahan')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'adjust' && selected && (
        <Modal title="Penyesuaian Poin Manual" onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div className="glass-lite rounded-3xl p-6 text-center border-amber-500/20 shadow-inner">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Member: <span className="text-[var(--text-main)]">{selected.name}</span></p>
               <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-[var(--primary)]">{selected.points.toLocaleString('id-ID')}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">Total Poin Saat Ini</span>
               </div>
            </div>
            <div className="space-y-4">
               <Field label="Nilai Penyesuaian (Gunakan - untuk Mengurangi)">
                  <div className="relative">
                     <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-amber-500">stars</span>
                     <input type="number" value={adjDelta} onChange={e => setAdjDelta(e.target.value)} placeholder="Contoh: 100 atau -50" className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:border-amber-500 transition-all" autoFocus />
                  </div>
               </Field>
               <Field label="Alasan Penyesuaian">
                  <textarea value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Tuliskan alasan penyesuaian poin..." className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl py-3 px-4 text-sm outline-none focus:border-amber-500 transition-all h-24 resize-none" />
               </Field>
            </div>
            {error && <p className="text-[var(--danger)] text-xs font-bold text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
            <div className="flex gap-4">
              <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-bold text-[var(--text-muted)]">Batal</button>
              <button onClick={handleAdjust} disabled={saving} className="bg-amber-500 text-slate-950 flex-[2] rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center h-12">
                {saving ? 'Memproses...' : 'Simpan Perubahan'}
              </button>
            </div>
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
    name: '', type: 'bundling', value: '', isActive: true,
    startDate: '', endDate: '',
    days: [] as number[], startHour: '', endHour: '',
    productIds: '', minLevel: 'bronze', discountType: 'percent'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  const addProductId = (id: number) => {
    const ids = form.productIds ? form.productIds.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (!ids.includes(id.toString())) {
      setForm((f: any) => ({ ...f, productIds: [...ids, id.toString()].join(',') }));
    }
  };

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
    setForm({ name: '', type: 'bundling', value: '', isActive: true, startDate: '', endDate: '', days: [], startHour: '', endHour: '', productIds: '', minLevel: 'bronze', discountType: 'percent' });
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
    }
    if (form.type === 'bundling') {
      c.productIds = form.productIds.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex justify-start sm:justify-end">
        <button onClick={openCreate} className="btn-primary py-3 px-6 h-12 w-full sm:w-auto">
          <span className="material-symbols-outlined">add_circle</span>
          <span>Buat Diskon Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] animate-pulse">
          <div className="size-12 border-4 border-[var(--border-dim)] border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Memuat data promosi...</p>
        </div>
      ) : discounts.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-2">
          <span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-4 opacity-30">local_offer_off</span>
          <h3 className="font-display text-xl font-bold mb-1">Belum ada promo</h3>
          <p className="text-sm text-[var(--text-muted)]">Mulai buat promo paket bundling atau diskon member untuk meningkatkan penjualan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map(d => {
            let cond: any = {};
            try { cond = d.conditions ? JSON.parse(d.conditions) : {}; } catch {}
            const isBundling = d.type === 'bundling';
            return (
              <div key={d.id} className="card p-0 !rounded-3xl flex flex-col group active:scale-[0.99] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-4" style={{ borderColor: d.isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                     <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${d.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {d.isActive ? '● Aktif' : '○ Nonaktif'}
                     </span>
                     <span className="material-symbols-outlined text-lg text-[var(--text-muted)] opacity-50">{isBundling ? 'inventory_2' : 'local_offer'}</span>
                  </div>
                  <h4 className="font-display text-base font-black text-[var(--text-main)] leading-tight mb-1">{d.name}</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)]">{TYPE_LABELS[d.type] || d.type}</p>
                </div>

                <div className="relative h-20 bg-gradient-to-br from-black/20 to-black/40 flex items-center justify-center overflow-hidden border-y border-[var(--border-dim)]">
                   <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                     <span className="material-symbols-outlined text-[5rem] font-black">{isBundling ? 'package_2' : 'percent'}</span>
                   </div>
                   <div className="relative z-10 flex flex-col items-center">
                      <span className="text-3xl font-black text-[var(--text-main)] shadow-sm">
                        {d.type === 'percent' ? `${parseFloat(d.value)}%` : formatRp(parseFloat(d.value))}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-0.5">Potongan Harga</span>
                   </div>
                </div>

                <div className="p-5 space-y-3 flex-1">
                   <div className="space-y-1.5">
                     {cond.days && (
                       <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                         <span className="material-symbols-outlined text-sm">calendar_today</span>
                         <span className="font-bold">{cond.days.map((n: number) => DAYS[n]).join(', ')}</span>
                       </div>
                     )}
                     {cond.startHour !== undefined && (
                       <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                         <span className="material-symbols-outlined text-sm">schedule</span>
                         <span className="font-bold">{cond.startHour}:00 – {cond.endHour}:00</span>
                       </div>
                     )}
                     {cond.productIds && (
                       <div className="flex items-center gap-2 text-[10px] text-[var(--primary)]">
                         <span className="material-symbols-outlined text-sm">inventory</span>
                         <span className="font-bold underline">{cond.productIds.length} Produk Bundling</span>
                       </div>
                     )}
                     {cond.minLevel && (
                       <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: LEVEL_COLORS[cond.minLevel] }}>
                         <span className="material-symbols-outlined text-sm">military_tech</span>
                         <span>Level Min: {LEVEL_LABELS[cond.minLevel].split(' ')[1]}</span>
                       </div>
                     )}
                   </div>

                   <div className="pt-3 border-t border-[var(--border-dim)] flex items-center justify-between">
                      <div className="text-[8px] text-[var(--text-muted)] font-bold italic">
                        {d.startDate ? new Date(d.startDate).toLocaleDateString('id-ID') : 'Mulai Sekarang'} – {d.endDate ? new Date(d.endDate).toLocaleDateString('id-ID') : 'Eternity'}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(d)} className="size-8 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">edit</span></button>
                        <button onClick={() => handleDelete(d)} className="size-8 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Promosi Baru' : 'Edit Promosi'} onClose={() => setModal(null)} wide>
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Field label="Identitas Promosi">
                    <input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Paket Bundling Kopi & Snack" className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-3 px-4 text-sm outline-none focus:border-[var(--primary)] transition-all" />
                  </Field>
                  <Field label="Jenis Promosi">
                    <select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-3 px-4 text-sm shadow-sm outline-none">
                      <option value="bundling">📦 PAKET BUNDLING (Gabungan Produk)</option>
                      <option value="percent">Persen (%) - Potongan Proporsional</option>
                      <option value="nominal">Nominal (Rp) - Potongan Tetap</option>
                      <option value="time-based">Berdasarkan Efek Waktu</option>
                      <option value="member">Hanya Untuk Member Spesifik</option>
                    </select>
                  </Field>
                  <Field label={`Nilai Potongan ${form.type === 'percent' ? '(%)' : '(Rupiah)'}`}>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">{form.type === 'percent' ? '%' : 'Rp'}</span>
                      <input type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-3 pl-12 pr-4 text-sm font-bold" />
                    </div>
                  </Field>
                </div>

                <div className="space-y-4 p-5 glass-lite rounded-3xl border-dashed border-2">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Konfigurasi Kondisi</h5>
                   {form.type === 'time-based' && (
                    <div className="space-y-4">
                      <Field label="Hari Berlaku">
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map((day, i) => (
                            <button key={i} type="button" onClick={() => toggleDay(i)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${form.days.includes(i) ? 'bg-primary text-slate-950 shadow-md' : 'bg-white/5 text-[var(--text-muted)] border border-white/5'}`}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Jam Mulai">
                          <input type="number" min={0} max={23} value={form.startHour} onChange={e => setForm((f: any) => ({ ...f, startHour: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl p-2.5 text-xs font-bold" />
                        </Field>
                        <Field label="Jam Selesai">
                          <input type="number" min={0} max={23} value={form.endHour} onChange={e => setForm((f: any) => ({ ...f, endHour: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl p-2.5 text-xs font-bold" />
                        </Field>
                      </div>
                    </div>
                   )}
                   {form.type === 'bundling' && (
                    <div className="space-y-3">
                      <Field label="Produk Dalam Paket (Gunakan Katalog >>)">
                        <input value={form.productIds} placeholder="ID Produk..." className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl p-2.5 text-xs font-bold" readOnly />
                      </Field>
                      <div className="bg-black/40 rounded-2xl p-3">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-[9px] font-black uppercase text-primary">Katalog Produk</span>
                           <input placeholder="Cari..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} className="bg-transparent border-b border-white/10 text-[10px] outline-none w-20 px-1" />
                         </div>
                         <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                           {products.filter((p: any) => !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase())).map((p: any) => (
                             <div key={p.id} className="flex items-center justify-between text-[10px] hover:bg-white/5 p-1 rounded transition-colors group">
                                <span className="truncate flex-1 pr-2 opacity-70 italic">#{p.id} {p.name}</span>
                                <button type="button" onClick={() => addProductId(p.id)} className="size-5 bg-emerald-500/20 text-emerald-500 rounded hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center font-black">+</button>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                   )}
                   {form.type === 'member' && (
                    <Field label="Minimal Member Level">
                      <select value={form.minLevel} onChange={e => setForm((f: any) => ({ ...f, minLevel: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-2 px-3 text-xs font-bold">
                        <option value="bronze">🥈 Tier Bronze</option>
                        <option value="silver">🥇 Tier Silver</option>
                        <option value="gold">💎 Tier Gold</option>
                      </select>
                    </Field>
                   )}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Field label="Mulai Berlaku">
                  <input type="date" value={form.startDate} onChange={e => setForm((f: any) => ({ ...f, startDate: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl p-2.5 text-xs font-bold" />
                </Field>
                <Field label="Berakhir">
                  <input type="date" value={form.endDate} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl p-2.5 text-xs font-bold" />
                </Field>
             </div>
             <label className="flex items-center gap-3 cursor-pointer group p-3 glass-lite rounded-2xl active:scale-[0.98] transition-all">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm((f: any) => ({ ...f, isActive: e.target.checked }))} className="size-5 rounded border-2 border-[var(--primary)] text-[var(--primary)] focus:ring-0" />
                <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">Promosi Aktif Secara Global</span>
             </label>
             {error && <p className="text-[var(--danger)] text-xs font-bold text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
             <div className="flex gap-4 pt-4 border-t border-[var(--border-dim)]">
                <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-bold text-[var(--text-muted)]">Batal</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-2 h-12">
                   {saving ? 'Menyimpan...' : 'Rilis Promosi'}
                </button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LoyaltyTab() {
  const [settings, setSettings] = useState({ pointRatio: '', pointValue: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/loyalty/settings');
      setSettings({ pointRatio: res.pointRatio.split('.')[0], pointValue: res.pointValue.split('.')[0] });
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!settings.pointRatio || !settings.pointValue) return setError('Semua bidang wajib diisi');
    setSaving(true); setError(''); setSuccess('');
    try {
      await apiFetch('/loyalty/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setSuccess('Pengaturan berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] animate-pulse">
      <div className="size-12 border-4 border-[var(--border-dim)] border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
      <p className="font-black uppercase tracking-widest text-[10px]">Sinkronisasi data loyalty...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto">
      <div className="card !p-8 flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 size-40 bg-[var(--primary)] opacity-5 blur-[80px] -mr-20 -mt-20"></div>
        <div className="text-center space-y-3 relative z-10">
          <div className="size-16 bg-amber-500/10 text-amber-500 rounded-2xl inline-flex items-center justify-center shadow-inner mb-2 border border-amber-500/20">
            <span className="material-symbols-outlined text-3xl">military_tech</span>
          </div>
          <h2 className="font-display text-2xl font-black text-[var(--text-main)]">Program Loyalty Pelanggan</h2>
          <p className="text-sm text-[var(--text-muted)]">Konfigurasikan bagaimana sistem memberikan apresiasi kepada pelanggan setia Anda.</p>
        </div>
        <div className="space-y-6 relative z-10 pt-4">
           <Field label="Rasio Akumulasi (Belanja Rp X = 1 Poin)">
             <div className="relative group">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">IDR</span>
               <input type="number" value={settings.pointRatio} onChange={e => setSettings(s => ({ ...s, pointRatio: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl py-4 pl-14 pr-4 font-black text-base outline-none focus:border-[var(--primary)] transition-all" />
             </div>
           </Field>
           <Field label="Nilai Tukar Poin (1 Poin = Potongan Rp X)">
             <div className="relative group">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xs text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">IDR</span>
               <input type="number" value={settings.pointValue} onChange={e => setSettings(s => ({ ...s, pointValue: e.target.value }))} className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-2xl py-4 pl-14 pr-4 font-black text-base outline-none focus:border-[var(--primary)] transition-all" />
             </div>
           </Field>
           <div className="bg-black/40 rounded-3xl p-5 border border-white/5 space-y-3 shadow-inner">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Simulasi Transaksi</p>
              <div className="flex items-center gap-4 text-sm leading-relaxed">
                 <div className="flex-1">
                   <p className="text-[var(--text-muted)] text-[11px] mb-1">Pelanggan belanja:</p>
                   <p className="font-black">Rp {parseInt(settings.pointRatio || '0').toLocaleString('id-ID')}</p>
                 </div>
                 <span className="material-symbols-outlined text-[var(--text-muted)]">arrow_forward</span>
                 <div className="flex-1 text-right">
                   <p className="text-[var(--text-muted)] text-[11px] mb-1">Mendapatkan:</p>
                   <p className="font-black text-[var(--primary)]">1 POIN LOYALTY</p>
                 </div>
              </div>
           </div>
        </div>
        {error && <p className="text-[var(--danger)] text-xs font-bold text-center bg-red-500/10 p-3 rounded-xl">{error}</p>}
        {success && <p className="text-emerald-500 text-sm font-black text-center bg-emerald-500/10 p-3 rounded-xl flex items-center justify-center gap-2">
           <span className="material-symbols-outlined text-base">check_circle</span>
           {success}
        </p>}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4 mt-2">
           {saving ? 'Sinkronisasi...' : 'Terapkan Aturan Baru'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<'members' | 'discounts' | 'loyalty'>('members');

  const headerTabs = (
    <nav className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
       {[
         ['members', 'person_search', 'Daftar Member'],
         ['discounts', 'celebration', 'Promo & Bundling'],
         ['loyalty', 'auto_fix', 'Aturan Poin']
       ].map(([key, icon, label]) => (
         <button
           key={key}
           onClick={() => setTab(key as any)}
           className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${tab === key ? 'bg-primary text-slate-900 shadow-lg' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5'}`}
         >
           <span className="material-symbols-outlined text-[14px]">{icon}</span>
           {label}
         </button>
       ))}
    </nav>
  );

  return (
    <Layout
      currentPort={5193}
      title="Members & Rewards"
      subtitle="Kerabat POS Ecosystem"
      maxWidth="1400px"
    >
      <div className="sticky top-0 lg:top-0 z-40 mb-8 -mx-4 md:-mx-10 px-4 md:px-10 py-4 bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border-dim)]">
        {headerTabs}
      </div>
      {tab === 'members' ? <MemberTab /> : tab === 'discounts' ? <DiscountTab /> : <LoyaltyTab />}
    </Layout>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`glass !rounded-[2.5rem] w-full max-h-[95vh] overflow-y-auto flex flex-col shadow-2xl animate-in zoom-in duration-300 ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
        <div className="p-8 pb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="size-10 rounded-full flex items-center justify-center bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="p-8 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-1">{label}</label>
      {children}
    </div>
  );
}

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
  type: 'percent' | 'nominal' | 'time-based' | 'bundling' | 'member' | 'buy_x_get_y' | 'qr_voucher';
  value: string;
  conditions?: string;
  isActive: boolean;
  isStackable: boolean;
  isExclusive: boolean;
  startDate?: string;
  endDate?: string;
  minPurchase?: string;
  // Financial Controls
  discountCap?: string | null;
  budgetLimit?: string | null;
  budgetUsed?: string;
  // Quota
  totalQuota?: number | null;
  totalUsed?: number;
  limitPerUser?: number | null;
  // Priority & Distribution
  priority?: number;
  voucherCode?: string | null;
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
  'mix_and_match': '✨ Mix & Match (Flat)',
  member: '👤 Member',
  'buy_x_get_y': '🎁 Beli X Gratis Y',
  'qr_voucher': '🎟️ Voucher QR',
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
  const [subTab, setSubTab] = useState<'auto' | 'code' | 'bundle'>('auto');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Discount | null>(null);
  const [step, setStep] = useState(1);
  const [wizardCategory, setWizardCategory] = useState<'auto' | 'code' | 'bundle' | null>(null);

  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const EMPTY_FORM = {
    name: '', type: 'percent', value: '', isActive: true, isStackable: false, isExclusive: false,
    startDate: '', endDate: '',
    days: [] as number[], startHour: '', endHour: '',
    productIds: [] as string[],
    minLevel: '', isMemberRestricted: false,
    flatPrice: '',
    minPurchase: '', discountCap: '', budgetLimit: '',
    totalQuota: '', limitPerUser: '',
    priority: 5, voucherCode: '',
    orderSources: [] as string[],
  };
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dRes = await apiFetch('/discounts');
      setDiscounts(dRes.data || []);
      const pRes = await apiFetch('/products');
      setProducts(pRes.data || pRes || []);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (d: Discount) => {
    try {
      await apiFetch(`/discounts/${d.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !d.isActive }) });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM); setProdSearch(''); setError(''); setStep(1); setWizardCategory(null); setSelected(null); setModal('create');
  };

  const openEdit = (d: Discount) => {
    let cond: any = {};
    try { cond = d.conditions ? (JSON.parse(d.conditions) ?? {}) : {}; } catch {}
    setSelected(d);
    let cat: 'auto' | 'code' | 'bundle' = 'auto';
    if (d.type === 'bundling') cat = 'bundle';
    else if (d.voucherCode) cat = 'code';
    setWizardCategory(cat);
    setForm({
      name: d.name, type: d.type, value: d.value,
      isActive: d.isActive, isStackable: d.isStackable, isExclusive: d.isExclusive,
      startDate: d.startDate?.slice(0, 10) || '', endDate: d.endDate?.slice(0, 10) || '',
      days: cond.days || [], startHour: cond.startHour?.toString() || '', endHour: cond.endHour?.toString() || '',
      productIds: (cond.productIds || []).map(String),
      minLevel: cond.minLevel || '', isMemberRestricted: !!cond.minLevel,
      flatPrice: cond.flatPrice || '',
      minPurchase: d.minPurchase || '', discountCap: d.discountCap || '', budgetLimit: d.budgetLimit || '',
      totalQuota: d.totalQuota?.toString() || '', limitPerUser: d.limitPerUser?.toString() || '',
      priority: d.priority ?? 5, voucherCode: d.voucherCode || '',
      orderSources: cond.orderSources || [],
    });
    setError(''); setStep(2); setModal('edit');
  };

  const buildPayload = () => {
    const cond: any = {};
    if (form.days.length > 0) cond.days = form.days;
    if (form.startHour !== '') cond.startHour = parseInt(form.startHour);
    if (form.endHour !== '') cond.endHour = parseInt(form.endHour);
    if (form.productIds.length > 0) cond.productIds = form.productIds.map(Number);
    if (form.isMemberRestricted && form.minLevel) cond.minLevel = form.minLevel;
    if (form.flatPrice) cond.flatPrice = form.flatPrice;
    if (form.orderSources.length > 0) cond.orderSources = form.orderSources;
    return {
      name: form.name, type: form.type, value: form.flatPrice ? 0 : parseFloat(form.value || '0'),
      isActive: form.isActive, isStackable: form.isStackable, isExclusive: form.isExclusive,
      startDate: form.startDate || null, endDate: form.endDate || null,
      conditions: Object.keys(cond).length > 0 ? cond : null,
      minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : 0,
      discountCap: (form.type === 'percent' && form.discountCap) ? parseFloat(form.discountCap) : null,
      budgetLimit: form.budgetLimit ? parseFloat(form.budgetLimit) : null,
      totalQuota: form.totalQuota ? parseInt(form.totalQuota) : null,
      limitPerUser: form.limitPerUser ? parseInt(form.limitPerUser) : null,
      priority: parseInt(form.priority) || 5,
      voucherCode: wizardCategory === 'code' && form.voucherCode ? form.voucherCode.trim().toUpperCase() : null,
    };
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Nama promo wajib diisi');
    if (wizardCategory === 'bundle' && form.productIds.length < 2) return setError('Bundling perlu minimal 2 produk');
    if (wizardCategory === 'bundle' && !form.flatPrice) return setError('Harga paket wajib diisi');
    if (wizardCategory !== 'bundle' && !form.value && !form.flatPrice) return setError('Besar potongan wajib diisi');
    if (wizardCategory === 'code' && !form.voucherCode.trim()) return setError('Kode promo wajib diisi');
    setSaving(true); setError('');
    try {
      if (modal === 'create') await apiFetch('/discounts', { method: 'POST', body: JSON.stringify(buildPayload()) });
      else if (modal === 'edit' && selected) await apiFetch(`/discounts/${selected.id}`, { method: 'PUT', body: JSON.stringify(buildPayload()) });
      setModal(null); load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (d: Discount) => {
    if (!confirm(`Hapus promo "${d.name}"?`)) return;
    try { await apiFetch(`/discounts/${d.id}`, { method: 'DELETE' }); load(); } catch (e: any) { alert(e.message); }
  };

  const toggleDay = (day: number) => setForm((f: any) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d: number) => d !== day) : [...f.days, day] }));
  const addProduct = (id: number) => { if (!form.productIds.includes(id.toString())) setForm((f: any) => ({ ...f, productIds: [...f.productIds, id.toString()] })); };
  const removeProduct = (id: string) => setForm((f: any) => ({ ...f, productIds: f.productIds.filter((p: string) => p !== id) }));

  const filtered = discounts.filter(d => {
    let cond: any = {}; try { cond = d.conditions ? JSON.parse(d.conditions) : {}; } catch {}
    if (subTab === 'bundle') return d.type === 'bundling';
    if (subTab === 'code') return !!d.voucherCode && d.type !== 'bundling';
    return !d.voucherCode && d.type !== 'bundling';
  });

  const bundleOriginal = form.productIds.reduce((sum: number, pid: string) => sum + (products.find(p => p.id.toString() === pid)?.price || products.find(p => p.id.toString() === pid)?.sellingPrice || 0), 0);
  const bundleSaving = bundleOriginal - parseFloat(form.flatPrice || '0');

  const INPUT_CLS = "w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-[var(--primary)] transition-all";
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 gap-1">
          {[ ['auto', 'bolt', 'Promo Otomatis'], ['code', 'confirmation_number', 'Kode Promo'], ['bundle', 'package_2', 'Bundling & Paket'] ].map(([key, icon, label]) => (
            <button key={key} onClick={() => setSubTab(key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === key ? (key === 'auto' ? 'bg-primary text-slate-900' : key === 'code' ? 'bg-amber-500 text-slate-900' : 'bg-purple-500 text-white') : 'text-[var(--text-muted)] hover:bg-white/5'}`}>
              <span className="material-symbols-outlined text-[13px]">{icon}</span>{label}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="btn-primary py-3 px-6 h-12 w-full sm:w-auto"><span className="material-symbols-outlined">add_circle</span><span>Buat Promo Baru</span></button>
      </div>

      <div className={`rounded-2xl p-3 flex items-center gap-3 text-[10px] font-bold border ${subTab === 'auto' ? 'bg-primary/5 border-primary/20 text-primary' : subTab === 'code' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-purple-500/5 border-purple-500/20 text-purple-400'}`}>
        <span className="material-symbols-outlined text-base">info</span>
        {subTab === 'auto' && 'Promo ini berlaku otomatis di kasir tanpa perlu kode. Dapat dibatasi berdasarkan jadwal, hari, atau level member.'}
        {subTab === 'code' && 'Promo ini hanya aktif jika kasir memasukkan kode yang sesuai. Cocok untuk kampanye pemasaran dan voucher khusus.'}
        {subTab === 'bundle' && 'Promo ini aktif ketika semua produk dalam paket ada di keranjang sekaligus. Harga paket menggantikan total harga normal.'}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] animate-pulse"><div className="size-12 border-4 border-[var(--border-dim)] border-t-[var(--primary)] rounded-full animate-spin mb-4"></div><p className="font-black uppercase tracking-widest text-[10px]">Memuat...</p></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-2"><span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-4 opacity-30">{subTab === 'auto' ? 'bolt' : subTab === 'code' ? 'confirmation_number' : 'package_2'}</span><h3 className="font-display text-xl font-bold mb-1">Belum ada promo</h3><p className="text-sm text-[var(--text-muted)]">Klik "Buat Promo Baru" untuk memulai.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(d => {
            let cond: any = {}; try { cond = d.conditions ? JSON.parse(d.conditions) : {}; } catch {}
            const budgetUsed = parseFloat(d.budgetUsed || '0'), budgetLimit = d.budgetLimit ? parseFloat(d.budgetLimit) : null;
            const accentColor = d.type === 'bundling' ? '#a855f7' : d.voucherCode ? '#f59e0b' : 'var(--primary)';
            return (
              <div key={d.id} className="card p-0 !rounded-3xl flex flex-col group active:scale-[0.99] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-4 overflow-hidden" style={{ borderColor: d.isActive ? accentColor : '#475569' }}>
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => handleToggleActive(d)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${d.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>{d.isActive ? '● Aktif' : '○ Nonaktif'}</button>
                    {d.isExclusive && <span className="px-2 py-1 rounded-lg text-[8px] font-black bg-purple-500/20 text-purple-400">🔒 Eksklusif</span>}
                  </div>
                  <h4 className="font-display text-base font-black truncate">{d.name}</h4>
                  <p className="text-[9px] font-black uppercase" style={{ color: accentColor }}>{TYPE_LABELS[d.type] || d.type}</p>
                </div>
                <div className="relative h-20 bg-gradient-to-br from-black/20 to-black/40 flex items-center justify-center border-y border-[var(--border-dim)]">
                  <div className="relative z-10 flex flex-col items-center">
                    {d.type === 'bundling' && cond.flatPrice ? (
                      <><span className="text-2xl font-black">{formatRp(parseFloat(cond.flatPrice))}</span><span className="text-[8px] font-bold text-purple-400 mt-0.5">{(cond.productIds || []).length} Produk</span></>
                    ) : (
                      <><span className="text-3xl font-black">{d.type === 'percent' ? `${parseFloat(d.value)}%` : formatRp(parseFloat(d.value))}</span></>
                    )}
                  </div>
                </div>
                <div className="px-5 pt-3 space-y-2">
                  {budgetLimit && <div className="text-[8px] font-black uppercase flex justify-between"><span className="text-[var(--text-muted)]">Budget</span><span className="text-emerald-400">{formatRp(budgetUsed)} / {formatRp(budgetLimit)}</span></div>}
                  {d.voucherCode && <div className="bg-amber-500/10 rounded-xl p-2 flex justify-between items-center"><span className="text-[9px] font-black text-amber-400 font-mono tracking-widest">{d.voucherCode}</span><span className="text-[7px] font-black uppercase text-amber-500/60">Kode Promo</span></div>}
                </div>
                <div className="p-5 pt-3 flex-1 flex flex-col justify-end">
                  <div className="pt-3 border-t border-[var(--border-dim)] flex items-center justify-between gap-2">
                    <span className="text-[8px] text-[var(--text-muted)] italic">{d.startDate ? new Date(d.startDate).toLocaleDateString('id-ID') : 'Sekarang'}</span>
                    <div className="flex gap-2">
                       <button onClick={() => openEdit(d)} className="size-8 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white"><span className="material-symbols-outlined text-sm">edit</span></button>
                       <button onClick={() => handleDelete(d)} className="size-8 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Buat Promo Baru' : `Edit: ${selected?.name}`} onClose={() => setModal(null)} wide>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-black ${step >= s ? 'bg-primary text-slate-900' : 'bg-white/5 text-[var(--text-muted)]'}`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-primary' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[ { key: 'auto', icon: 'bolt', title: 'Promo Otomatis', bg: 'bg-primary/20 text-primary' }, { key: 'code', icon: 'confirmation_number', title: 'Kode Promo', bg: 'bg-amber-500/20 text-amber-500' }, { key: 'bundle', icon: 'package_2', title: 'Bundling', bg: 'bg-purple-500/20 text-purple-400' } ].map(cat => (
                  <button key={cat.key} onClick={() => { setWizardCategory(cat.key as any); setForm((f: any) => ({ ...f, type: cat.key === 'bundle' ? 'bundling' : 'percent' })); setStep(2); }} className={`p-6 rounded-3xl border border-[var(--border-dim)] hover:border-white/50 text-left cursor-pointer transition-all ${cat.bg}`}>
                    <span className="material-symbols-outlined text-3xl mb-2 block">{cat.icon}</span>
                    <p className="font-black">{cat.title}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && wizardCategory && (
              <div className="space-y-4">
                <Field label="Nama / Judul Promo"><input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className={INPUT_CLS} autoFocus /></Field>
                {wizardCategory === 'auto' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Jenis Potongan"><select value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))} className={INPUT_CLS}><option value="percent">Persen</option><option value="nominal">Nominal</option></select></Field>
                    <Field label="Nilai Potongan"><input type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))} className={INPUT_CLS} /></Field>
                  </div>
                )}
                {wizardCategory === 'code' && (
                  <>
                    <Field label="Kode Promo Unik (CAPS)"><input value={form.voucherCode} onChange={e => setForm((f: any) => ({ ...f, voucherCode: e.target.value.toUpperCase().replace(/\s/g, '') }))} className={INPUT_CLS} /></Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Jenis Potongan"><select value={form.flatPrice ? 'flat' : form.type} onChange={e => { const val = e.target.value; if (val === 'flat') { setForm((f: any) => ({ ...f, type: 'nominal', flatPrice: f.value || '0' })); } else { setForm((f: any) => ({ ...f, type: val, flatPrice: '' })); } }} className={INPUT_CLS}><option value="percent">Persen</option><option value="nominal">Nominal / Rupiah</option><option value="flat">Harga Jadi / Flat Price</option></select></Field>
                      <Field label="Nilai / Harga"><input type="number" value={form.flatPrice || form.value} onChange={e => { if (form.flatPrice !== '') setForm((f: any) => ({ ...f, flatPrice: e.target.value })); else setForm((f: any) => ({ ...f, value: e.target.value })); }} className={INPUT_CLS} /></Field>
                    </div>
                  </>
                )}
                {wizardCategory === 'bundle' && (
                  <>
                    <Field label="Harga Paket Total (Harga Final)"><input type="number" value={form.flatPrice} onChange={e => setForm((f: any) => ({ ...f, flatPrice: e.target.value }))} className={INPUT_CLS} /></Field>
                  </>
                )}
                {wizardCategory && (
                  <Field label={wizardCategory === 'bundle' ? "Pilih Produk untuk Paket (min. 2)" : "Pilih Produk Target (kosong = berlaku ke seluruh pesanan)"}>
                    <div className="flex flex-wrap gap-2 p-2 bg-black/20 rounded-xl mb-2 min-h-12 border border-[var(--border-dim)]">
                      {form.productIds.length === 0 && <span className="text-[10px] text-[var(--text-muted)] font-bold italic w-full text-center mt-1">Belum ada produk dipilih</span>}
                      {form.productIds.map((pid: string) => {
                        const p = products.find(p => p.id.toString() === pid);
                        return <span key={pid} className={`px-2 py-1 flex items-center gap-1.5 rounded-lg text-[10px] font-black border ${wizardCategory === 'bundle' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : wizardCategory === 'code' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                          {p?.name || `ID ${pid}`}
                          <button type="button" onClick={() => removeProduct(pid)} className="hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </span>
                      })}
                    </div>
                    <div className="relative mb-2">
                       <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">search</span>
                       <input placeholder="Cari menu produk..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} className={`${INPUT_CLS} pl-9 py-2`} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {products.filter(p=>!prodSearch || (p.name || '').toLowerCase().includes(prodSearch.toLowerCase())).map(p=>{
                        const selected = form.productIds.includes(p.id.toString());
                        return (
                          <button type="button" key={p.id} onClick={() => selected ? removeProduct(p.id.toString()) : addProduct(p.id)} className={`text-left text-xs p-2.5 rounded-xl transition-all flex justify-between items-center group border ${selected ? (wizardCategory === 'bundle' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : wizardCategory === 'code' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-primary/20 border-primary/50 text-primary') : 'bg-white/5 border-white/5 hover:border-white/20 text-[var(--text-muted)]'}`}>
                            <span className="truncate pr-2">{p.name}</span>
                            <span className={`shrink-0 font-black text-sm opacity-50 group-hover:opacity-100 ${selected ? 'text-red-400' : 'text-emerald-400'}`}>{selected ? '−' : '+'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tgl Mulai"><input type="date" value={form.startDate} onChange={e=>setForm((f:any)=>({...f, startDate: e.target.value}))} className={INPUT_CLS} /></Field>
                  <Field label="Tgl Selesai"><input type="date" value={form.endDate} onChange={e=>setForm((f:any)=>({...f, endDate: e.target.value}))} className={INPUT_CLS} /></Field>
                  <Field label="Budget Maksimal (Rp)"><input type="number" value={form.budgetLimit} onChange={e=>setForm((f:any)=>({...f, budgetLimit: e.target.value}))} className={INPUT_CLS} /></Field>
                  <Field label="Kuota Maksimal"><input type="number" value={form.totalQuota} onChange={e=>setForm((f:any)=>({...f, totalQuota: e.target.value}))} className={INPUT_CLS} /></Field>
                </div>
                <Field label="Hari Aktif">
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((d,i) => <button key={i} onClick={()=>toggleDay(i)} className={`px-3 py-1 text-xs rounded ${form.days.includes(i) ? 'bg-primary text-slate-900' : 'bg-white/10 text-white'}`}>{d}</button>)}
                  </div>
                </Field>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.isStackable} onChange={e=>setForm((f:any)=>({...f, isStackable:e.target.checked}))} /> <span className="text-xs font-bold text-amber-500">Stackable (Bisa gabung diskon lain)</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.isExclusive} onChange={e=>setForm((f:any)=>({...f, isExclusive:e.target.checked}))} /> <span className="text-xs font-bold text-purple-400">Exclusive (Diskon terkuat)</span></label>
                </div>
              </div>
            )}

            {error && <div className="p-3 bg-red-500/10 text-red-500 text-xs font-bold rounded">{error}</div>}
            
            <div className="flex gap-2">
              {step > 1 ? <button onClick={() => setStep(s => s - 1)} className="px-4 py-3 bg-white/5 rounded-xl font-bold flex-1">Kembali</button> : <button onClick={() => setModal(null)} className="px-4 py-3 bg-white/5 rounded-xl font-bold flex-1">Batal</button>}
              {step < 3 ? <button onClick={() => setStep(s => s + 1)} className="px-4 py-3 bg-primary text-slate-900 rounded-xl font-bold flex-[2]">Lanjut</button> 
                        : <button onClick={handleSave} disabled={saving} className="px-4 py-3 bg-primary text-slate-900 rounded-xl font-bold flex-[2]">{saving ? 'Menyimpan...' : 'Simpan'}</button>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Voucher Tab ──────────────────────────────────────────────────────────────
interface VoucherBatch {
  id: string;
  promoName: string;
  quantity: number;
  createdAt: string;
}

function VoucherTab() {
  const [batches, setBatches] = useState<VoucherBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [batchVouchers, setBatchVouchers] = useState<Record<string, any[]>>({});
  const [loadingVouchers, setLoadingVouchers] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/vouchers/promo/batches');
      setBatches(res.data || []);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteBatch = async (batch: VoucherBatch) => {
    if (!confirm(`Hapus batch "${batch.promoName}" beserta ${batch.quantity} voucher di dalamnya?`)) return;
    try {
      await apiFetch(`/vouchers/promo/batches/${batch.id}`, { method: 'DELETE' });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const toggleBatch = async (batchId: string) => {
    if (expandedBatch === batchId) { setExpandedBatch(null); return; }
    setExpandedBatch(batchId);
    if (!batchVouchers[batchId]) {
      setLoadingVouchers(prev => ({ ...prev, [batchId]: true }));
      try {
        const res = await apiFetch(`/vouchers/promo/batches/${batchId}/vouchers`);
        setBatchVouchers(prev => ({ ...prev, [batchId]: res.data || [] }));
      } catch (e: any) { console.error(e); }
      finally { setLoadingVouchers(prev => ({ ...prev, [batchId]: false })); }
    }
  };

  const handleDeleteVoucher = async (voucher: any, batchId: string) => {
    if (!confirm(`Hapus voucher "${voucher.code}"?`)) return;
    try {
      await apiFetch(`/vouchers/promo/vouchers/${voucher.id}`, { method: 'DELETE' });
      setBatchVouchers(prev => ({ ...prev, [batchId]: (prev[batchId] || []).filter(v => v.id !== voucher.id) }));
    } catch (e: any) { alert(e.message); }
  };

  const STATUS_COLORS: Record<string, string> = {
    unused: '#22c55e',
    redeemed: '#f59e0b',
    expired: '#ef4444',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] animate-pulse">
          <div className="size-12 border-4 border-[var(--border-dim)] border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
          <p className="font-black uppercase tracking-widest text-[10px]">Memuat data voucher...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center border-dashed border-2 border-[var(--border-dim)]">
          <span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-4 opacity-30">confirmation_number</span>
          <h3 className="font-display text-xl font-bold mb-1">Belum ada batch voucher</h3>
          <p className="text-sm text-[var(--text-muted)]">Generate voucher terlebih dahulu melalui menu Voucher Generator.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map(batch => (
            <div key={batch.id} className="card !rounded-3xl overflow-hidden border border-[var(--border-dim)]">
              {/* Batch header row */}
              <div className="flex items-center gap-4 p-5">
                <div className="size-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
                  <span className="material-symbols-outlined text-xl">confirmation_number</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-[var(--text-main)] truncate">{batch.promoName}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">
                    {batch.quantity} voucher &bull; {new Date(batch.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBatch(batch.id)}
                    className="size-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                    title="Lihat Detail Voucher"
                  >
                    <span className="material-symbols-outlined text-sm">{expandedBatch === batch.id ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBatch(batch)}
                    className="size-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Hapus Batch"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>

              {/* Voucher list (expanded) */}
              {expandedBatch === batch.id && (
                <div className="border-t border-[var(--border-dim)] bg-black/20">
                  {loadingVouchers[batch.id] ? (
                    <div className="flex items-center justify-center py-8 text-[var(--text-muted)] gap-3">
                      <div className="size-5 border-2 border-[var(--border-dim)] border-t-[var(--primary)] rounded-full animate-spin"></div>
                      <span className="text-xs font-bold">Memuat voucher...</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-dim)]">
                            {['Kode Voucher', 'Menu', 'Harga Voucher', 'Status', 'Kadaluwarsa', 'Aksi'].map(h => (
                              <th key={h} className="px-4 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-dim)]">
                          {(batchVouchers[batch.id] || []).map(v => (
                            <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                              <td className="px-4 py-3 font-mono font-bold text-amber-400">{v.code}</td>
                              <td className="px-4 py-3 text-[var(--text-muted)] font-medium truncate max-w-[120px]">{v.menuName || '—'}</td>
                              <td className="px-4 py-3 font-bold text-[var(--primary)]">{v.voucherPrice ? formatRp(parseFloat(v.voucherPrice)) : '—'}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider" style={{ background: `${STATUS_COLORS[v.status] || '#94a3b8'}22`, color: STATUS_COLORS[v.status] || '#94a3b8' }}>
                                  {v.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[var(--text-muted)] font-medium">{new Date(v.expiresAt).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleDeleteVoucher(v, batch.id)}
                                  disabled={v.status === 'redeemed'}
                                  className="size-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                                  title={v.status === 'redeemed' ? 'Tidak dapat menghapus voucher yang sudah digunakan' : 'Hapus Voucher'}
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(batchVouchers[batch.id] || []).length === 0 && (
                        <p className="text-center text-[var(--text-muted)] text-xs py-8">Tidak ada voucher ditemukan.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
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
  const [tab, setTab] = useState<'members' | 'discounts' | 'vouchers' | 'loyalty'>('members');

  const headerTabs = (
    <nav className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
       {[
         ['members', 'person_search', 'Daftar Member'],
         ['discounts', 'celebration', 'Promo & Bundling'],
         ['vouchers', 'confirmation_number', 'Voucher'],
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
      <div className="z-40 pt-2 pb-4 -mx-4 md:-mx-10 px-4 md:px-10 mb-2">
        {headerTabs}
      </div>
      <div className="relative">
        {tab === 'members' ? <MemberTab /> : tab === 'discounts' ? <DiscountTab /> : tab === 'vouchers' ? <VoucherTab /> : <LoyaltyTab />}
      </div>
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

import React, { useState, useEffect } from 'react';
import { useNotification } from '@shared/components/NotificationProvider';

interface OpenShiftModalProps {
    isOpen: boolean;
    onOpen: (initialCash: number) => Promise<void>;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onOpen }) => {
    const [initialCash, setInitialCash] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onOpen(initialCash);
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        <span className="material-symbols-outlined text-4xl text-primary">login</span>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Buka Shift Kasir</h2>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Masukkan modal awal laci kas (Petty Cash)</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Kas Awal (Tunai)</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">Rp</span>
                            <input 
                                type="number"
                                autoFocus
                                required
                                value={initialCash || ''}
                                onChange={(e) => setInitialCash(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[0, 20000, 50000, 100000].map(val => (
                            <button 
                                key={val}
                                type="button"
                                onClick={() => setInitialCash(val)}
                                className="py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-black hover:bg-primary/20 hover:text-primary transition-all uppercase"
                            >
                                {val === 0 ? 'Kosong' : `Rp ${val.toLocaleString('id-ID')}`}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-[#0f172a] h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Membuka...' : 'Mulai Shift Sekarang'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CloseShiftModalProps {
    isOpen: boolean;
    shift: any;
    summary: any;
    onClose: (data: { actualCash: number, actualNonCash: number, notes: string, denominations: Record<string, number>, nonCashVerified: boolean }) => Promise<void>;
    onCancel: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, shift, summary, onClose, onCancel }) => {
    const [denominations, setDenominations] = useState<Record<string, number>>({});
    const [actualNonCash, setActualNonCash] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [nonCashVerified, setNonCashVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (summary) {
            setActualNonCash(summary.totalNonCashSales);
        }
    }, [summary]);

    if (!isOpen || !summary) return null;

    const expectedCash = parseFloat(shift.initialCash) + summary.totalCashSales - summary.totalExpenses;
    
    // Calculate total actual cash from denominations
    const actualCash = Object.entries(denominations).reduce((total, [nominalStr, qty]) => {
        const nominal = parseInt(nominalStr);
        // If nominal is 1, it means Coins (which we treat as direct amount input, not qty)
        if (nominal === 1) return total + qty;
        return total + (nominal * qty);
    }, 0);

    const discrepancy = actualCash - expectedCash;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onClose({ actualCash, actualNonCash, notes, denominations, nonCashVerified });
            setStep(1);
            setDenominations({});
            setNonCashVerified(false);
            setNotes('');
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                
                {step === 1 ? (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
                                <span className="material-symbols-outlined text-4xl text-red-500">logout</span>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Tutup Shift Kasir</h2>
                            <p className="text-[var(--text-muted)] text-sm mt-1">Tinjau ringkasan penjualan hari ini</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-primary opacity-60 mb-1">Total Omzet</p>
                                <p className="text-sm font-black text-white">Rp {summary.totalOmzet.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-500 opacity-60 mb-1">Total Tunai</p>
                                <p className="text-sm font-black text-white">Rp {summary.totalCashSales.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 opacity-60 mb-1">Total Non-Tunai</p>
                                <p className="text-sm font-black text-white">Rp {summary.totalNonCashSales.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-red-500 opacity-60 mb-1">Pengeluaran</p>
                                <p className="text-sm font-black text-white">Rp {summary.totalExpenses.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">Detail Per Kategori</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {summary?.categories?.map((cat: any) => (
                                    <div key={cat.name} className="flex justify-between items-center py-1 sm:px-2">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{cat.name}</span>
                                        <span className="text-xs font-black text-white">Rp {cat.total.toLocaleString()}</span>
                                    </div>
                                ))}
                                {(!summary?.categories || summary.categories.length === 0) && (
                                    <p className="text-[10px] text-white/40 italic">Tidak ada rincian kategori.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={onCancel} className="flex-1 bg-white/5 h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Batal</button>
                            <button onClick={() => setStep(2)} className="flex-[2] bg-primary text-[#0f172a] h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Lanjutkan Penghitungan Kas</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Hitung Uang Kasir</h2>
                            <p className="text-[var(--text-muted)] text-sm mt-1">Masukkan jumlah uang aktual di laci</p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">Ekspektasi Kas (Sistem)</span>
                                <p className="text-[8px] text-blue-400/60 uppercase font-black tracking-tighter">Kas Awal + Tunai - Pengeluaran</p>
                            </div>
                            <span className="text-xl font-black text-white">Rp {expectedCash.toLocaleString()}</span>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Kalkulator Denominasi Kas Fisik</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map(nominal => (
                                    <div key={nominal} className="bg-white/5 border border-white/5 rounded-xl p-2 relative flex items-center justify-between group focus-within:border-primary/50 transition-colors">
                                        <span className="text-[10px] font-black text-[var(--text-muted)] w-12">{nominal / 1000}k</span>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={denominations[nominal] || ''}
                                            onChange={(e) => setDenominations({ ...denominations, [nominal]: parseInt(e.target.value) || 0 })}
                                            className="w-16 bg-black/20 border border-white/10 rounded-lg text-center py-1 text-sm font-bold text-white outline-none focus:bg-primary/10 transition-all placeholder:text-white/20"
                                            placeholder="0"
                                        />
                                        <span className="text-[8px] font-black uppercase tracking-widest absolute -top-2 -right-2 bg-primary/20 text-primary border border-primary/20 px-1.5 rounded-md hidden group-focus-within:block">Lbr</span>
                                    </div>
                                ))}
                                {/* Koin (Input Total Value) */}
                                <div className="bg-white/5 border border-white/5 rounded-xl p-2 relative flex items-center justify-between group focus-within:border-primary/50 transition-colors">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] w-12">Koin</span>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={denominations[1] || ''}
                                        onChange={(e) => setDenominations({ ...denominations, [1]: parseInt(e.target.value) || 0 })}
                                        className="w-full ml-auto max-w-[80px] bg-black/20 border border-white/10 rounded-lg text-right pr-2 py-1 text-sm font-bold text-white outline-none focus:bg-primary/10 transition-all placeholder:text-white/20"
                                        placeholder="Rp 0"
                                    />
                                    <span className="text-[8px] font-black uppercase tracking-widest absolute -top-2 -right-2 bg-primary/20 text-primary border border-primary/20 px-1.5 rounded-md hidden group-focus-within:block">Total</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-3 px-4 bg-black/20 rounded-2xl border border-white/5 mt-2">
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Total Aktual Kasir:</span>
                                <span className="text-2xl font-black text-white">Rp {actualCash.toLocaleString()}</span>
                            </div>

                            <div className={`p-4 rounded-2xl border ${discrepancy === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : Math.abs(discrepancy) > 50000 ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' : discrepancy < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Selisih (Discrepancy)</span>
                                        {Math.abs(discrepancy) > 50000 && <p className="text-[8px] font-bold text-red-400 mt-1 uppercase tracking-widest">⚠️ Peringatan: Selisih Kritis &gt; 50k</p>}
                                        {Math.abs(discrepancy) >= 10000 && Math.abs(discrepancy) <= 50000 && <p className="text-[8px] font-bold text-amber-400 mt-1 uppercase tracking-widest">⚠️ Perhatian: Selisih Cukup Besar</p>}
                                    </div>
                                    <span className={`text-xl font-black ${discrepancy === 0 ? 'text-emerald-500' : discrepancy < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                        {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {summary?.nonCashTransactions && summary.nonCashTransactions.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Daftar Transaksi Non-Tunai</label>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl max-h-[150px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {summary.nonCashTransactions.map((tx: any) => (
                                            <div key={tx.id} className="flex justify-between items-center px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white">{tx.method} - {tx.ref || 'Tanpa Ref'}</span>
                                                    <span className="text-[8px] text-[var(--text-muted)]">{new Date(tx.time).toLocaleTimeString()}</span>
                                                </div>
                                                <span className="text-xs font-black text-primary">Rp {parseFloat(tx.total).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex gap-3 items-start">
                                <input 
                                    type="checkbox" 
                                    id="nonCashVerif"
                                    checked={nonCashVerified}
                                    onChange={(e) => setNonCashVerified(e.target.checked)}
                                    className="mt-1 size-5 accent-primary rounded cursor-pointer"
                                />
                                <label htmlFor="nonCashVerif" className="text-sm font-bold text-white cursor-pointer select-none">
                                    Saya memverifikasi bahwa <span className="text-primary font-black">{summary.nonCashTransactions?.length || 0}</span> transaksi Non-Tunai sebesar <span className="text-primary font-black">Rp {summary.totalNonCashSales.toLocaleString()}</span> telah masuk ke sistem pembayaran (QRIS/EDC).
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Catatan Kasir (Opsional)</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all min-h-[80px]"
                                    placeholder="Alasan selisih uang kas..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 bg-white/5 h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Kembali</button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting || !nonCashVerified}
                                className="flex-[2] bg-red-500 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-95 transition-all text-center disabled:opacity-30 disabled:grayscale"
                            >
                                {isSubmitting ? 'Memproses...' : 'Tutup Shift Sekarang'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface HandoverShiftModalProps {
    isOpen: boolean;
    shift: any;
    onHandover: (data: { currentShiftId: number; cashAmount: number; nextCashierName: string; adminPin: string }) => Promise<void>;
    onCancel: () => void;
}

export const HandoverShiftModal: React.FC<HandoverShiftModalProps> = ({ isOpen, shift, onHandover, onCancel }) => {
    const [cashAmount, setCashAmount] = useState<number>(0);
    const [nextCashierName, setNextCashierName] = useState('');
    const [adminPin, setAdminPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();

    if (!isOpen || !shift) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onHandover({
                currentShiftId: shift.id,
                cashAmount,
                nextCashierName,
                adminPin
            });
            setCashAmount(0);
            setNextCashierName('');
            setAdminPin('');
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[50] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="size-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20">
                        <span className="material-symbols-outlined text-4xl text-amber-500">sync_alt</span>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Oper Shift (Handover)</h2>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Serah terima mesin kasir ke shift berikutnya.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 ml-2">Total Uang Laci Aktual</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">Rp</span>
                            <input 
                                type="number"
                                required
                                value={cashAmount || ''}
                                onChange={(e) => setCashAmount(parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-amber-500/30 focus:border-amber-500 rounded-2xl pl-12 pr-6 py-4 text-xl font-black text-white outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-[9px] font-bold text-amber-500/60 ml-2">Ini akan menjadi modal awal shift penerima.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Username Kasir Penerima</label>
                        <input 
                            type="text"
                            required
                            value={nextCashierName}
                            onChange={(e) => setNextCashierName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all uppercase"
                            placeholder="Cth: KASIR-MALAM"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">PIN Otorisasi (Penyelia/Admin)</label>
                        <input 
                            type="password"
                            required
                            value={adminPin}
                            onChange={(e) => setAdminPin(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all tracking-[0.5em]"
                            placeholder="****"
                            maxLength={6}
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button type="button" onClick={onCancel} className="flex-1 bg-white/5 h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Batal</button>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] bg-amber-500 text-[#0f172a] h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:opacity-95 active:scale-95 transition-all"
                        >
                            {isSubmitting ? 'Memproses...' : 'Serahkan Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

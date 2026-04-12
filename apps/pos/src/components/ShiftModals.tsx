import React, { useState, useEffect } from 'react';

interface OpenShiftModalProps {
    isOpen: boolean;
    onOpen: (initialCash: number) => Promise<void>;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onOpen }) => {
    const [initialCash, setInitialCash] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onOpen(initialCash);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
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

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-[#0f172a] h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Membuka...' : 'Mulai Shift Sekarang'}
                    </button>
                </form>
            </div>
        </div>
    );
};

interface CloseShiftModalProps {
    isOpen: boolean;
    shift: any;
    summary: any;
    onClose: (data: { actualCash: number, actualNonCash: number, notes: string }) => Promise<void>;
    onCancel: () => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({ isOpen, shift, summary, onClose, onCancel }) => {
    const [actualCash, setActualCash] = useState<number>(0);
    const [actualNonCash, setActualNonCash] = useState<number>(0);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (summary) {
            setActualNonCash(summary.totalNonCashSales);
        }
    }, [summary]);

    if (!isOpen || !summary) return null;

    const expectedCash = parseFloat(shift.initialCash) + summary.totalCashSales - summary.totalExpenses;
    const discrepancy = actualCash - expectedCash;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onClose({ actualCash, actualNonCash, notes });
            setStep(1);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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
                                {summary.categories.map((cat: any) => (
                                    <div key={cat.name} className="flex justify-between items-center py-1 sm:px-2">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{cat.name}</span>
                                        <span className="text-xs font-black text-white">Rp {cat.total.toLocaleString()}</span>
                                    </div>
                                ))}
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

                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Ekspektasi Kas (Sistem)</span>
                                <span className="text-sm font-black text-white">Rp {expectedCash.toLocaleString()}</span>
                            </div>
                            <p className="text-[8px] text-blue-400/60 uppercase font-black tracking-tighter">Kas Awal + Tunai - Pengeluaran</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Aktual Kas (Di Laci)</label>
                                <input 
                                    type="number"
                                    autoFocus
                                    required
                                    value={actualCash || ''}
                                    onChange={(e) => setActualCash(parseInt(e.target.value) || 0)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl font-black text-white outline-none focus:border-primary/50 transition-all"
                                    placeholder="0"
                                />
                            </div>

                            <div className={`p-4 rounded-2xl border ${discrepancy === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : discrepancy < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Selisih</span>
                                    <span className={`text-lg font-black ${discrepancy === 0 ? 'text-emerald-500' : discrepancy < 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                        {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2">Catatan Kasir (Opsional)</label>
                                <textarea 
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all min-h-[100px]"
                                    placeholder="Alasan selisih, kondisi shift, dll..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 bg-white/5 h-14 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Kembali</button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-[2] bg-red-500 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-95 transition-all text-center"
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

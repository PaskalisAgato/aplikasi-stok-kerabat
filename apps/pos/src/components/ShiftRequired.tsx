import React from 'react';

interface ShiftRequiredProps {
    onOpenShift: () => void;
}

const ShiftRequired: React.FC<ShiftRequiredProps> = ({ onOpenShift }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-6 animate-in fade-in duration-500">
            <div className="size-24 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-500/5">
                <span className="material-symbols-outlined text-5xl text-red-500">lock</span>
            </div>
            <div className="max-w-md">
                <h2 className="text-2xl font-black uppercase tracking-tight dark:text-white dark:text-white text-slate-900">Shift Belum Dibuka</h2>
                <p className="text-sm dark:text-white dark:text-white text-slate-900/50 font-bold uppercase tracking-widest mt-3 leading-relaxed">
                    Anda harus membuka shift kasir dengan memasukkan modal awal (Petty Cash) untuk mulai melakukan transaksi penjualan.
                </p>
            </div>
            <button 
                onClick={onOpenShift}
                className="mt-4 px-10 py-4 bg-primary text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
                <span className="material-symbols-outlined font-black">login</span>
                Mulai Buka Shift
            </button>
            <div className="flex items-center gap-2 mt-4 px-4 py-2 dark:bg-white/5 bg-white shadow-sm border border-slate-200 rounded-full border dark:border-white/5 border-slate-200">
                <span className="material-symbols-outlined text-xs text-primary">info</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#a0a0a0]">Halaman laporan dan menu lainnya tetap dapat diakses.</span>
            </div>
        </div>
    );
};

export default ShiftRequired;

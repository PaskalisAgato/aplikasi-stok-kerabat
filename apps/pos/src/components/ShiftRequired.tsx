import React from 'react';

interface ShiftRequiredProps {
    onOpenShift: () => void;
}

const ShiftRequired: React.FC<ShiftRequiredProps> = ({ onOpenShift }) => {
    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 md:p-8 overflow-hidden font-black">
            {/* Dark Backdrop with heavy blur to truly separate from POS UI */}
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" />
            
            {/* Animated Background Elements for Premium Feel */}
            <div className="absolute top-1/4 left-1/4 size-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 size-96 bg-red-500/5 rounded-full blur-[120px] animate-pulse delay-700" />

            <div className="relative w-full max-w-lg flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
                {/* Icon Container */}
                <div className="relative mb-10 group">
                    <div className="size-28 bg-white/[0.03] rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-5xl text-primary font-black">lock</span>
                        </div>
                    </div>
                    {/* Ring decoration */}
                    <div className="absolute -inset-4 border border-white/5 rounded-[3rem] animate-[spin_10s_linear_infinite] opacity-20" />
                </div>

                {/* Content */}
                <div className="space-y-4 mb-12">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                        Akses Kasir <span className="text-primary italic">Terkunci</span>
                    </h2>
                    <div className="h-1 w-20 bg-primary/50 mx-auto rounded-full" />
                    <p className="text-sm md:text-base text-white/50 font-bold uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
                        Shift kasir belum dibuka. Harap masukkan modal awal laci untuk mulai bertransaksi hari ini.
                    </p>
                </div>

                {/* Main Action */}
                <button 
                    onClick={onOpenShift}
                    className="group relative w-full sm:w-auto min-w-[280px] h-18 bg-primary text-[#020617] rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 py-5"
                >
                    <span className="material-symbols-outlined font-black text-2xl group-hover:rotate-12 transition-transform">key</span>
                    Buka Shift Sekarang
                </button>

                {/* Footer Info */}
                <div className="mt-16 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 px-6 py-3 bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-md">
                        <div className="size-2 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sistem Siap Operasional</span>
                    </div>
                    
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed max-w-[250px]">
                        Laporan dan pengaturan perangkat tetap dapat diakses melalui menu navigasi jika diizinkan.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShiftRequired;


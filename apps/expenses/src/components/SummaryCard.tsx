import React from 'react';

interface SummaryCardProps {
    total: number;
    title?: string;
    compact?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ total, title, compact }) => {
    return (
        <div className={`card group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${compact ? 'p-6' : 'p-10'}`}>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm font-black">finance_chip</span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80">Ringkasan Finansial</p>
                </div>
                
                <div className="space-y-1">
                    <h2 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                        {title || 'Total Pengeluaran Periode Ini'}
                    </h2>
                    <p className={`${compact ? 'text-xl' : 'text-3xl'} font-black text-[var(--text-main)] font-display tracking-tighter uppercase`}>
                        Rp {(total || 0).toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-500/10 w-fit px-3 py-1.5 rounded-lg border border-red-500/20">
                    <span className="material-symbols-outlined text-sm font-black">trending_down</span>
                    Sinkronisasi Realtime
                </div>
            </div>

            {/* Decorative Icon */}
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-primary transform group-hover:rotate-6 duration-700">
                <span className="material-symbols-outlined font-black" style={{ fontSize: compact ? '120px' : '180px' }}>receipt_long</span>
            </div>
        </div>
    );
};

export default SummaryCard;

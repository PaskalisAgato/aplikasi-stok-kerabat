import React from 'react';

interface SummaryCardProps {
    total: number;
    compact?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ total, compact }) => {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-primary/5 border border-primary/20 shadow-sm ${compact ? 'p-4' : 'p-8'}`}>
            <div className="flex flex-col gap-1">
                <p className={`${compact ? 'text-[10px]' : 'text-xs'} uppercase tracking-wider font-semibold text-primary`}>Ringkasan</p>
                <h2 className={`${compact ? 'text-xs' : 'text-base'} font-medium text-muted`}>Total Pengeluaran Bulan Ini</h2>
                <p className={`${compact ? 'text-xl' : 'text-4xl'} font-black mt-1 text-main`}>Rp {(total || 0).toLocaleString('id-ID')}</p>
            </div>
            {/* Decorative icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: compact ? '48px' : '96px' }}>receipt_long</span>
            </div>
        </div>
    );
};

export default SummaryCard;


import React from 'react';

interface SummaryCardProps {
    total: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ total }) => {
    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-5 shadow-sm">
            <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-primary">Ringkasan</p>
                <h2 className="text-base font-medium opacity-80">Total Pengeluaran Bulan Ini</h2>
                <p className="text-3xl font-bold mt-1 text-slate-900 ">Rp {(total || 0).toLocaleString('id-ID')}</p>
            </div>
            {/* Decorative icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: '96px' }}>receipt_long</span>
            </div>
        </div>
    );
};

export default SummaryCard;


import React from 'react';
import { getTargetUrl } from '@shared/navigation';

const BottomNav: React.FC = () => {
    const homeUrl = getTargetUrl(5173);
    const stokUrl = getTargetUrl(5174);
    const laporanUrl = getTargetUrl(5175);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background-app  border-t border-primary/20 px-4 pb-6 pt-2 z-30">
            <div className="flex justify-around items-center max-w-md mx-auto">
                <a className="flex flex-col items-center gap-1 dark:text-slate-400 dark:text-slate-400 text-slate-500 " href={homeUrl}>
                    <span className="material-symbols-outlined">home</span>
                    <p className="text-[10px] font-medium uppercase tracking-tighter">Home</p>
                </a>
                <a className="flex flex-col items-center gap-1 dark:text-slate-400 dark:text-slate-400 text-slate-500 " href={stokUrl}>
                    <span className="material-symbols-outlined">inventory_2</span>
                    <p className="text-[10px] font-medium uppercase tracking-tighter">Stok</p>
                </a>
                <a className="flex flex-col items-center gap-1 text-primary" href="#">
                    <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        receipt_long
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-tighter">Transaksi</p>
                </a>
                <a className="flex flex-col items-center gap-1 dark:text-slate-400 dark:text-slate-400 text-slate-500 " href={laporanUrl}>
                    <span className="material-symbols-outlined">bar_chart_4_bars</span>
                    <p className="text-[10px] font-medium uppercase tracking-tighter">Laporan</p>
                </a>
            </div>
        </nav>
    );
};

export default BottomNav;


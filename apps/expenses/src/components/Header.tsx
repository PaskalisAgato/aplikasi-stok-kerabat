import React from 'react';

type TabType = 'penjualan' | 'pengeluaran';

interface HeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onMenuClick }) => {
    return (
        <header className="sticky top-0 z-10 bg-background-light/80  backdrop-blur-md border-b border-primary/20">
            <div className="flex items-center p-4 gap-2">
                <button
                    onClick={onMenuClick}
                    className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="text-lg font-bold leading-tight tracking-tight flex-1">Transaksi &amp; Pengeluaran</h1>
            </div>
            {/* Sub-tabs */}
            <div className="flex border-b border-primary/10 px-4">
                <button
                    onClick={() => onTabChange('penjualan')}
                    className={`flex-1 flex flex-col items-center justify-center border-b-2 pb-3 pt-2 transition-colors ${activeTab === 'penjualan'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 '
                        }`}
                >
                    <span className="text-sm font-semibold">Penjualan</span>
                </button>
                <button
                    onClick={() => onTabChange('pengeluaran')}
                    className={`flex-1 flex flex-col items-center justify-center border-b-2 pb-3 pt-2 transition-colors ${activeTab === 'pengeluaran'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 '
                        }`}
                >
                    <span className="text-sm font-semibold">Pengeluaran</span>
                </button>
            </div>
        </header>
    );
};

export default Header;


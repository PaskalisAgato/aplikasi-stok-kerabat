import React from 'react';

interface TransactionsBgProps {
    onOpenStockDetail: () => void;
}

/** Dimmed background of the Transactions list, shown behind the modal */
const TransactionsBg: React.FC<TransactionsBgProps> = ({ onOpenStockDetail }) => {
    const items = [
        { icon: 'coffee', label: 'Arabica Beans', sub: 'Inventory • 10:30 AM', amount: '-Rp 450.000', color: 'text-red-400' },
        { icon: 'bolt', label: 'Electricity Bill', sub: 'Utilities • 09:15 AM', amount: '-Rp 1.200.000', color: 'text-red-400' },
        { icon: 'payments', label: 'Daily Sales', sub: 'Revenue • Yesterday', amount: '+Rp 3.450.000', color: 'text-green-400' },
    ];

    return (
        <div className="fixed inset-0 z-0 flex flex-col opacity-40 grayscale-[20%]">
            <header className="p-4 flex justify-between items-center border-b border-primary/10">
                <h1 className="text-xl font-bold">Transactions</h1>
                <span className="material-symbols-outlined">search</span>
            </header>

            {/* Temporary dev button to open Stock Modal */}
            <div className="p-4 pointer-events-auto">
                <button
                    onClick={onOpenStockDetail}
                    className="w-full dark:bg-slate-800 bg-white dark:text-white dark:text-white text-slate-900 p-3 rounded-lg text-sm border dark:border-slate-700 border-slate-200"
                >
                    [DEV] Open Stock Detail Modal
                </button>
            </div>

            <div className="p-4 space-y-4 pointer-events-none">
                {items.map((item) => (
                    <div key={item.label} className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">{item.icon}</span>
                            </div>
                            <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-500">{item.sub}</p>
                            </div>
                        </div>
                        <p className={`font-bold ${item.color}`}>{item.amount}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionsBg;


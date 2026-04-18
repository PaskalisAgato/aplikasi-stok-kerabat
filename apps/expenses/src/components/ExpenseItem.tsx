import React from 'react';
import { getOptimizedImageUrl } from '@shared/supabase';

interface Expense {
    id: number;
    title: string;
    category: string;
    date: string;
    amount: string;
    receiptUrl?: string;
    hasReceipt?: boolean;
    fundSource?: 'CASHIER' | 'OWNER';
}

interface ExpenseItemProps {
    expense: Expense;
    onEdit?: (expense: Expense) => void;
    onDelete?: (id: number) => void;
    onPreview: (url: string) => void;
    formatDisplayDate: (dateStr: string) => string;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, onEdit, onDelete, onPreview, formatDisplayDate }) => {
    return (
        <div className="card group p-4 flex items-center justify-between gap-4 gpu transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border-white/5">
            <div className="flex items-center gap-5 flex-1 min-w-0">
                <div
                    onClick={() => {
                        if (expense.receiptUrl || expense.hasReceipt) {
                            onPreview(getOptimizedImageUrl(expense.receiptUrl || '', { width: 800, height: 800 }));
                        }
                    }}
                    className="size-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/5 bg-primary/5 text-primary shadow-inner transition-transform group-hover:rotate-3 cursor-zoom-in overflow-hidden relative"
                >
                    {expense.receiptUrl || expense.hasReceipt ? (
                        <img 
                            src={getOptimizedImageUrl(expense.receiptUrl || '', { width: 160, height: 160 })} 
                            alt="Receipt" 
                            className="size-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <span className="material-symbols-outlined text-3xl opacity-40">receipt_long</span>
                    )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{expense.category}</span>
                        {expense.fundSource === 'OWNER' && (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Uang Owner</span>
                        )}
                        {expense.fundSource === 'CASHIER' && (
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Uang Kasir</span>
                        )}
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">• {formatDisplayDate(expense.date)}</p>
                    </div>
                    <h4 className="font-black text-[var(--text-main)] text-lg font-display tracking-tight leading-tight uppercase truncate">{expense.title}</h4>
                </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
                <p className="text-xl font-black text-primary font-display tracking-tighter uppercase whitespace-nowrap">
                    Rp {Number(expense.amount).toLocaleString('id-ID')}
                </p>
                <div className="flex gap-2">
                    {onEdit && (
                        <button 
                            onClick={() => onEdit(expense)}
                            className="size-9 glass flex items-center justify-center rounded-xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/5"
                        >
                            <span className="material-symbols-outlined text-lg font-black">edit_square</span>
                        </button>
                    )}
                    {onDelete && (
                        <button 
                            onClick={() => onDelete(expense.id)}
                            className="size-9 glass flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 active:scale-90 transition-all border-red-500/20"
                        >
                            <span className="material-symbols-outlined text-lg font-black">delete_forever</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ExpenseItem);

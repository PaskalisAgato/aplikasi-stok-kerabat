import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Expense {
    id: number;
    title: string;
    category: string;
    date: string;
    amount: string;
    imageUrl?: string;
}

interface ExpenseListProps {
    expenses: Expense[];
    onDelete?: (id: number) => void;
    onEdit?: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const MONTHS = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const generateYears = () => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    };

    const filteredExpenses = expenses.filter(expense => {
        try {
            const expDate = new Date(expense.date);
            if (!isNaN(expDate.getTime())) {
                return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
            }
        } catch(e) {}
        return false;
    });

    const formatDisplayDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        } catch(e) {}
        return dateStr;
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Riwayat Transaksi</h3>
                    <p className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Daftar Pengeluaran</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    <div className="relative group min-w-[140px]">
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="w-full text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary pl-4 pr-10 py-3 rounded-xl outline-none border border-primary/20 appearance-none cursor-pointer glass hover:bg-primary/10 transition-all"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i} className="bg-slate-900 border-none">{m}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none font-black text-sm">expand_more</span>
                    </div>
                    <div className="relative group min-w-[100px]">
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary pl-4 pr-10 py-3 rounded-xl outline-none border border-primary/20 appearance-none cursor-pointer glass hover:bg-primary/10 transition-all font-display"
                        >
                            {generateYears().map((y) => (
                                <option key={y} value={y} className="bg-slate-900 border-none">{y}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none font-black text-sm">expand_more</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredExpenses.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 glass rounded-[2.5rem] border-dashed border-2 opacity-40"
                        >
                             <span className="material-symbols-outlined text-6xl text-primary font-black mb-4">search_off</span>
                             <p className="font-black text-xs uppercase tracking-[0.2em] text-[var(--text-main)]">Tidak ada pengeluaran</p>
                             <p className="text-[9px] uppercase tracking-widest mt-1 opacity-60">Coba pilih periode atau tahun lain</p>
                        </motion.div>
                    ) : (
                        filteredExpenses.map((expense) => (
                            <motion.div
                                key={expense.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                layout
                                className="card group p-4 flex items-center justify-between gap-4 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div
                                        onClick={() => expense.imageUrl && setPreviewImage(expense.imageUrl)}
                                        className="size-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/5 bg-primary/5 text-primary shadow-inner transition-transform group-hover:rotate-3 cursor-zoom-in"
                                    >
                                        <span className="material-symbols-outlined text-3xl font-black">
                                            {expense.imageUrl ? 'receipt_long' : 'no_photography'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{expense.category}</span>
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">• {formatDisplayDate(expense.date)}</p>
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
                                                className="size-9 glass flex items-center justify-center rounded-xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/5 shadow-inner"
                                            >
                                                <span className="material-symbols-outlined text-lg font-black">edit_square</span>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button 
                                                onClick={() => onDelete(expense.id)}
                                                className="size-9 glass flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 active:scale-90 transition-all border-red-500/20 shadow-inner"
                                            >
                                                <span className="material-symbols-outlined text-lg font-black">delete_forever</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-full max-h-full"
                        >
                            <img
                                src={previewImage}
                                alt="Receipt Preview"
                                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain border-4 border-white/10"
                            />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 right-0 size-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExpenseList;

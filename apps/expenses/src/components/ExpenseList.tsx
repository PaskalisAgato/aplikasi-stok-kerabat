import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpenseItem from './ExpenseItem';

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

interface ExpenseListProps {
    expenses: Expense[];
    onDelete?: (id: number) => void;
    onEdit?: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const formatDisplayDate = React.useCallback((dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        } catch(e) {}
        return dateStr;
    }, []);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Riwayat Transaksi</h3>
                    <p className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Daftar Pengeluaran</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 glass rounded-[2.5rem] border-dashed border-2 opacity-40">
                         <span className="material-symbols-outlined text-6xl text-primary font-black mb-4">search_off</span>
                         <p className="font-black text-xs uppercase tracking-[0.2em] text-[var(--text-main)]">Tidak ada pengeluaran</p>
                         <p className="text-[9px] uppercase tracking-widest mt-1 opacity-60">Coba pilih periode atau tahun lain</p>
                    </div>
                ) : (
                    expenses.map((expense) => (
                        <ExpenseItem 
                            key={expense.id}
                            expense={expense}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onPreview={(url) => setPreviewImage(url)}
                            formatDisplayDate={formatDisplayDate}
                        />
                    ))
                )}
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
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/800x800?text=Gambar+Tidak+Tersedia';
                                }}
                            />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 right-0 size-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-[var(--text-main)] transition-colors"
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
export default React.memo(ExpenseList);

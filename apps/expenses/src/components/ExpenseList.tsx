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
        <div className="space-y-4 pb-10">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Daftar Pengeluaran</h3>
                <div className="flex gap-2">
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="text-xs font-bold bg-primary/10 text-primary px-2 py-1.5 rounded outline-none border border-primary/20 appearance-none text-center cursor-pointer"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="text-xs font-bold bg-primary/10 text-primary px-2 py-1.5 rounded outline-none border border-primary/20 appearance-none text-center cursor-pointer"
                    >
                        {generateYears().map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {filteredExpenses.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-8">Tidak ada pengeluaran di periode ini.</p>
                    ) : (
                        filteredExpenses.map((expense) => (
                            <motion.div
                                key={expense.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                className="flex items-center gap-4 p-3 rounded-lg bg-slate-50  border border-primary/10 transition-colors group"
                            >
                                <div
                                    className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-primary/20 bg-slate-200 "
                                    style={{ backgroundImage: `url('${expense.imageUrl}')` }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{expense.title}</p>
                                    <p className="text-[10px] text-slate-500 font-medium bg-slate-200  rounded px-1.5 py-0.5 inline-block mt-1">{expense.category}</p>
                                    <p className="text-xs text-slate-500  mt-1">{formatDisplayDate(expense.date)}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="font-bold text-primary">Rp {Number(expense.amount).toLocaleString('id-ID')}</p>
                                    <div className="flex gap-2">
                                        {onEdit && (
                                            <button 
                                                onClick={() => onEdit(expense)}
                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button 
                                                onClick={() => onDelete(expense.id)}
                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-red-100  text-red-600 hover:bg-red-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ExpenseList;


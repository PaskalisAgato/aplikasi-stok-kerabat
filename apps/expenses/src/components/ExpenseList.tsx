import React from 'react';
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
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses }) => {
    return (
        <div className="space-y-4 pb-10">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Daftar Pengeluaran</h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">Oktober 2023</span>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {expenses.map((expense) => (
                        <motion.div
                            key={expense.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-primary/5 border border-primary/10 transition-colors"
                        >
                            <div
                                className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0 border border-primary/20 bg-slate-200 dark:bg-slate-800"
                                style={{ backgroundImage: `url('${expense.imageUrl}')` }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate">{expense.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{expense.category} • {expense.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary">Rp {expense.amount}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ExpenseList;

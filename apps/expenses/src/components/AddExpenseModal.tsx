import React, { useState } from 'react';

const RECEIPT_PLACEHOLDER = "https://lh3.googleusercontent.com/aida-public/AB6AXuBTvM5Q12GfACKk9r_zhhw0OCgi9ANw5ZQbnmRdZetIXY2IR3efM2tFVbCE_z-ayy4fuevoCkOqm5uVU-5A_uCSbNe4ZFN94yJ2SjBO18yqrqxlF4ER2zBQsumlEyrSfloxdwmMNMwXfuoAKplmadbY_WOY6XMEr4WzFOlNFSx5QKyxrOv0efcANCpDWZxf6x2jCbs2QPvmD9xqQQCmQpYywyNcr07DFBxMHCFKiMltoQHOUZfUx1QcRDaJmkBdRjf2MnLxircFQKo";

interface Category {
    id: string;
    label: string;
    icon: string;
}

const ALL_CATEGORIES: Category[] = [
    { id: 'coffee', label: 'Coffee & Beans', icon: 'coffee' },
    { id: 'utilities', label: 'Utilities', icon: 'bolt' },
    { id: 'maintenance', label: 'Maintenance', icon: 'build' },
    { id: 'salary', label: 'Staff Salary', icon: 'groups' },
    { id: 'other', label: 'Other', icon: 'category' },
];

const FREQUENT_CATEGORIES: Category[] = [
    { id: 'coffee', label: 'Coffee Beans', icon: 'coffee' },
    { id: 'milk', label: 'Milk', icon: 'water_drop' },
    { id: 'packaging', label: 'Packaging', icon: 'inventory_2' },
];

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: any) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('coffee');
    const [categorySearch, setCategorySearch] = useState('');
    const [receipt, setReceipt] = useState<string | null>(RECEIPT_PLACEHOLDER);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        const cat = ALL_CATEGORIES.find(c => c.id === selectedCategory);
        
        try {
            await apiClient.addExpense({
                title: name,
                category: cat?.label ?? 'Other',
                amount: Number(amount),
                receiptUrl: receipt || '',
                date: expenseDate
            });

            onAdd({}); // Just trigger a refresh on parent
            setName('');
            setAmount('');
            setSelectedCategory('coffee');
            setCategorySearch('');
            setReceipt(RECEIPT_PLACEHOLDER);
            onClose();
        } catch (error) {
            console.error('Failed to save expense', error);
            alert('Gagal merekam pengeluaran.');
        }
    };

    const filteredCategories = ALL_CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const handleToggleCategory = (id: string) => {
        setSelectedCategory(prev => prev === id ? '' : id);
    };

    return (
        /* Full-screen overlay */
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Bottom Sheet */}
            <div className="w-full bg-background-light dark:bg-background-dark rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">

                {/* Drag Handle */}
                <div className="flex h-6 w-full items-center justify-center flex-shrink-0">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30" />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add New Expense</h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Expense Name */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Expense Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Arabica Beans Supply"
                                required
                                className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-slate-100 placeholder:text-slate-500"
                            />
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Amount (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">Rp</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    required
                                    className="w-full h-14 pl-12 pr-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-slate-100 text-xl font-bold"
                                />
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Tanggal Transaksi</label>
                            <input
                                type="date"
                                value={expenseDate}
                                onChange={e => setExpenseDate(e.target.value)}
                                className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-slate-100 font-medium"
                            />
                        </div>

                        {/* Categories — chip-based */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Categories</label>

                            {/* Frequently Used */}
                            <div className="flex flex-col gap-2 mb-4">
                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Frequently Used</p>
                                <div className="flex flex-wrap gap-2">
                                    {FREQUENT_CATEGORIES.map(fc => (
                                        <button
                                            key={fc.id}
                                            type="button"
                                            onClick={() => handleToggleCategory(fc.id)}
                                            className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-slate-400 flex items-center gap-1.5 hover:bg-primary/10 transition-all text-xs font-medium"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{fc.icon}</span>
                                            {fc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Search */}
                            <div className="relative mb-4">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60" style={{ fontSize: '20px' }}>search</span>
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onChange={e => setCategorySearch(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full h-11 pl-11 pr-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all dark:text-slate-100 text-sm placeholder:text-slate-500"
                                />
                            </div>

                            {/* Category Chips */}
                            <div className="flex flex-wrap gap-2">
                                {filteredCategories.map(cat => {
                                    const isSelected = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleToggleCategory(cat.id)}
                                            className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isSelected
                                                    ? 'border-primary/40 bg-primary text-white'
                                                    : 'border-primary/20 bg-primary/5 text-slate-400 hover:bg-primary/10'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cat.icon}</span>
                                            <span className="text-sm font-medium">{cat.label}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                                            )}
                                        </button>
                                    );
                                })}

                                {/* Add new category button */}
                                <button
                                    type="button"
                                    className="w-9 h-9 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center text-primary bg-primary/5"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Receipt Photo */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Receipt Photo</label>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Upload Button */}
                                <button
                                    type="button"
                                    className="aspect-square rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: '32px' }}>add_a_photo</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Take Photo</span>
                                </button>

                                {/* Thumbnail Preview */}
                                {receipt && (
                                    <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/20 group">
                                        <img
                                            src={receipt}
                                            alt="Receipt"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-white">visibility</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setReceipt(null)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-10 mb-4">
                            <button
                                type="submit"
                                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Save Expense
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseModal;

import React, { useState } from 'react';
import { supabase } from '@shared/supabase';
import { apiClient } from '@shared/apiClient';

const RECEIPT_PLACEHOLDER = "https://lh3.googleusercontent.com/aida-public/AB6AXuBTvM5Q12GfACKk9r_zhhw0OCgi9ANw5ZQbnmRdZetIXY2IR3efM2tFVbCE_z-ayy4fuevoCkOqm5uVU-5A_uCSbNe4ZFN94yJ2SjBO18yqrqxlF4ER2zBQsumlEyrSfloxdwmMNMwXfuoAKplmadbY_WOY6XMEr4WzFOlNFSx5QKyxrOv0efcANCpDWZxf6x2jCbs2QPvmD9xqQQCmQpYywyNcr07DFBxMHCFKiMltoQHOUZfUx1QcRDaJmkBdRjf2MnLxircFQKo";

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: any) => void;
    initialData?: any;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAdd, initialData }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [receipt, setReceipt] = useState<string | null>(RECEIPT_PLACEHOLDER);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fetchCategories = async () => {
        try {
            const data = await apiClient.getExpenseCategories();
            setCategories(Array.isArray(data) ? data : []);
            if (Array.isArray(data) && data.length > 0 && !selectedCategory && !initialData) {
                setSelectedCategory(data[0].name);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (initialData && isOpen && categories.length > 0) {
            setName(initialData.title || '');
            setAmount(initialData.amount?.toString() || '');
            setSelectedCategory(initialData.category || '');
            setReceipt(initialData.imageUrl || RECEIPT_PLACEHOLDER);
            setExpenseDate(new Date(initialData.date).toISOString().split('T')[0]);
        } else if (isOpen && !initialData) {
            // Reset for new expense
            setName('');
            setAmount('');
            if (categories.length > 0) setSelectedCategory(categories[0].name);
            setReceipt(RECEIPT_PLACEHOLDER);
            setExpenseDate(new Date().toISOString().split('T')[0]);
        }
    }, [initialData, isOpen, categories]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setReceipt(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        setIsUploading(true);
        let finalReceiptUrl = receipt || '';

        try {
            // 1. If there's a new file, upload to Supabase Storage
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `receipts/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('expenses')
                    .upload(filePath, selectedFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Supabase upload error:', uploadError);
                    let userMessage = uploadError.message;
                    if (uploadError.message.includes('bucket_not_found') || uploadError.message.toLowerCase().includes('bucket not found')) {
                        userMessage = 'Bucket "expenses" tidak ditemukan di Supabase. Pastikan bucket sudah dibuat dan diatur ke Public.';
                    }
                    throw new Error(userMessage);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('expenses')
                    .getPublicUrl(filePath);
                
                finalReceiptUrl = publicUrl;
            }

            // 2. Add or Update Expense in database
            const expensePayload = {
                title: name,
                category: selectedCategory || 'Other',
                amount: Number(amount),
                receiptUrl: finalReceiptUrl,
                date: expenseDate
            };

            if (initialData?.id) {
                await apiClient.updateExpense(initialData.id, expensePayload);
            } else {
                await apiClient.addExpense(expensePayload);
            }

            onAdd({}); 
            setName('');
            setAmount('');
            setSelectedCategory('coffee');
            setCategorySearch('');
            setReceipt(RECEIPT_PLACEHOLDER);
            setSelectedFile(null);
            onClose();
        } catch (error: any) {
            console.error('Failed to save expense:', error);
            alert(`Gagal merekam pengeluaran: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const filteredCategories = (Array.isArray(categories) ? categories : []).filter(c =>
        c && c.name && c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const handleToggleCategory = (name: string) => {
        setSelectedCategory(prev => prev === name ? '' : name);
    };

    const handleAddCategory = async () => {
        const catName = prompt('Enter new category name:');
        if (!catName) return;
        try {
            await apiClient.addExpenseCategory({ name: catName, icon: 'category' });
            fetchCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
            alert('Gagal menambah kategori');
        }
    };

    const handleDeleteCategory = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Hapus kategori ini?')) return;
        try {
            await apiClient.deleteExpenseCategory(id);
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('Gagal menghapus kategori');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Bottom Sheet */}
            <div className="w-full bg-background-light  rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">

                {/* Drag Handle */}
                <div className="flex h-6 w-full items-center justify-center flex-shrink-0">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30" />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 ">{initialData ? 'Edit Expense' : 'Add New Expense'}</h2>
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
                                className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  placeholder:text-slate-500"
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
                                    className="w-full h-14 pl-12 pr-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  text-xl font-bold"
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
                                className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  font-medium"
                            />
                        </div>

                        {/* Categories — chip-based */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Categories</label>

                            {/* Category Search */}
                            <div className="relative mb-4">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60" style={{ fontSize: '20px' }}>search</span>
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onChange={e => setCategorySearch(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full h-11 pl-11 pr-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  text-sm placeholder:text-slate-500"
                                />
                            </div>

                            {/* Category Chips */}
                            <div className="flex flex-wrap gap-2">
                                {filteredCategories.map(cat => {
                                    const isSelected = selectedCategory === cat.name;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleToggleCategory(cat.name)}
                                            className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isSelected
                                                    ? 'border-primary/40 bg-primary text-white'
                                                    : 'border-primary/20 bg-primary/5 text-slate-400 hover:bg-primary/10'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cat.icon || 'category'}</span>
                                            <span className="text-sm font-medium">{cat.name}</span>
                                            <span 
                                                onClick={(e) => handleDeleteCategory(e, cat.id)}
                                                className="material-symbols-outlined hover:text-red-400 p-0.5 rounded-full transition-colors" 
                                                style={{ fontSize: '14px' }}
                                            >
                                                close
                                            </span>
                                        </button>
                                    );
                                })}

                                {/* Add new category button */}
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="w-9 h-9 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Receipt Photo */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Receipt Photo</label>
                            
                            {/* Hidden file input */}
                            <input
                                type="file"
                                id="receipt-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                {/* Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('receipt-upload')?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: '32px' }}>add_a_photo</span>
                                    <span className="text-xs font-medium text-slate-500 ">Take Photo</span>
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
                                            onClick={() => {
                                                setReceipt(null);
                                                setSelectedFile(null);
                                            }}
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
                                disabled={isUploading}
                                className={`w-full h-16 ${isUploading ? 'bg-slate-400' : 'bg-primary hover:bg-primary/90'} text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all`}
                            >
                                {isUploading ? (
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined">check_circle</span>
                                )}
                                {isUploading ? 'Uploading & Saving...' : (initialData ? 'Update Expense' : 'Save Expense')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseModal;

